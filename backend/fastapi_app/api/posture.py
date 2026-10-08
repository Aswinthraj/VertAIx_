import asyncio
import json
import logging
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from fastapi_app.core.dependencies import get_current_user
from fastapi_app.core.frame_decoder import decode_base64_image, decode_image_bytes
from fastapi_app.core.security import ACCESS_TOKEN_TYPE, decode_token
from fastapi_app.database.models import User
from fastapi_app.database.session import SessionLocal, get_db
from fastapi_app.schemas.posture import (
    DetectionModeRequest,
    FrameProcessRequest,
    PostureResponse,
)

logger = logging.getLogger("vertaix.api.posture")
router = APIRouter(tags=["posture"])


@router.get("/api/posture", response_model=PostureResponse)
def get_posture_status(
    current_user: User = Depends(get_current_user),
) -> PostureResponse:
    """Returns real-time posture metrics for the authenticated user."""
    from posture_runtime import get_posture

    return PostureResponse.model_validate(get_posture(str(current_user.id)))


@router.post("/api/posture/process-frame", response_model=PostureResponse)
async def process_frame_endpoint(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> PostureResponse:
    """
    HTTP Frame Processing Endpoint.
    Accepts encoded image frames (multipart/form-data or JSON base64 string),
    decodes into OpenCV BGR numpy array, and executes CameraWorker.process_frame()
    for the authenticated user via threadpool offloading.
    """
    from fastapi_app.core.camera_worker import get_camera_worker

    content_type = request.headers.get("content-type", "")
    worker = get_camera_worker()
    user_id_str = str(current_user.id)

    if "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file")
        if not file_obj or not hasattr(file_obj, "read"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing file in multipart upload. Provide 'file' field.",
            )
        contents = await file_obj.read()
        try:
            frame = decode_image_bytes(contents)
        except ValueError as val_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(val_err),
            )
    else:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload or Content-Type header.",
            )
        image_str = body.get("image")
        if not image_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing 'image' field in JSON request body.",
            )
        try:
            frame = decode_base64_image(image_str)
        except ValueError as val_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(val_err),
            )

    result = await run_in_threadpool(worker.process_frame, frame, user_id=user_id_str)
    return PostureResponse.model_validate(result)


def _authenticate_jwt_token(token: str, db: Session) -> User | None:
    """Helper to validate JWT token and fetch user."""
    try:
        payload = decode_token(token, ACCESS_TOKEN_TYPE)
        user_id = int(payload["sub"])
        return db.get(User, user_id)
    except Exception as exc:
        logger.debug("WebSocket JWT auth error: %s", exc)
        return None


@router.websocket("/api/posture/ws")
async def websocket_posture_endpoint(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> None:
    """
    Production-Hardened WebSocket Frame Streaming Endpoint.

    Security:
    - Primary auth: In-band handshake message {"type": "auth", "token": "<JWT>"}
      sent over encrypted TLS/WSS. Never leaks JWT into URL access/proxy logs.
    - Fallback auth: query parameter ?token=<JWT> supported for legacy/testing clients.
    - Strict 5.0-second authentication handshake timeout.

    Concurrency:
    - CPU-bound worker.process_frame() execution is offloaded to Starlette's threadpool
      via run_in_threadpool(), preventing event-loop blockage and preserving frame order.
    """
    await websocket.accept()

    authenticated_user: User | None = None
    with SessionLocal() as db:
        if token:
            authenticated_user = _authenticate_jwt_token(token, db)

        if not authenticated_user:
            # Wait for in-band auth handshake message with 5s timeout
            try:
                auth_msg_raw = await asyncio.wait_for(websocket.receive(), timeout=5.0)
                if auth_msg_raw.get("type") == "websocket.disconnect":
                    return

                if "text" in auth_msg_raw and auth_msg_raw["text"]:
                    auth_data = json.loads(auth_msg_raw["text"])
                    extracted_token = auth_data.get("token")
                    if extracted_token:
                        authenticated_user = _authenticate_jwt_token(extracted_token, db)
            except asyncio.TimeoutError:
                logger.warning("WebSocket authentication timed out (5s)")
                await websocket.send_json({"error": "Authentication timeout", "status": "unauthorized"})
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Auth timeout")
                return
            except Exception as auth_err:
                logger.warning("WebSocket handshake parse failed: %s", auth_err)

    if not authenticated_user:
        logger.warning("WebSocket authentication failed")
        await websocket.send_json({"error": "Invalid or missing authentication token", "status": "unauthorized"})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return

    # Authentication successful
    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    user_id_str = str(authenticated_user.id)
    worker.ensure_user_session(user_id_str)
    await websocket.send_json({"status": "authenticated", "user_id": authenticated_user.id})
    logger.info("WebSocket authenticated successfully for user %s", user_id_str)

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                try:
                    frame = decode_image_bytes(raw_bytes)
                    result = await run_in_threadpool(worker.process_frame, frame, user_id=user_id_str)
                    await websocket.send_json(result)
                except ValueError as exc:
                    logger.warning("Invalid WebSocket binary frame for user %s: %s", user_id_str, exc)
                    await websocket.send_json({"error": "Invalid frame payload", "status": "Error"})
                except Exception:
                    logger.exception("WebSocket binary frame processing failed for user %s", user_id_str)
                    await websocket.send_json({"error": "Frame processing failed", "status": "Error"})
            elif "text" in message and message["text"]:
                text_data = message["text"]
                try:
                    data = json.loads(text_data)
                    if "image" in data:
                        frame = decode_base64_image(data["image"])
                        result = await run_in_threadpool(worker.process_frame, frame, user_id=user_id_str)
                        await websocket.send_json(result)
                    elif "mode" in data:
                        new_mode = data["mode"]
                        success = worker.set_detection_mode(new_mode, user_id=user_id_str)
                        await websocket.send_json({
                            "action": "mode",
                            "mode": worker.get_detection_mode(user_id_str),
                            "success": success,
                        })
                    elif "ping" in data:
                        await websocket.send_json({"pong": True})
                    elif data.get("type") == "auth":
                        # Redundant auth message, acknowledge
                        await websocket.send_json({"status": "already_authenticated"})
                except ValueError as exc:
                    logger.warning("Invalid WebSocket text payload for user %s: %s", user_id_str, exc)
                    await websocket.send_json({"error": "Invalid frame payload", "status": "Error"})
                except Exception:
                    logger.exception("WebSocket text processing failed for user %s", user_id_str)
                    await websocket.send_json({"error": "Frame processing failed", "status": "Error"})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected gracefully for user %s", user_id_str)
    except Exception as exc:
        logger.warning("WebSocket exception for user %s: %s", user_id_str, exc)


@router.get("/api/detection-mode")
def get_detection_mode(
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Returns the current posture classification mode for the authenticated user."""
    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    return {"mode": worker.get_detection_mode(str(current_user.id))}


@router.post("/api/set-mode")
def set_detection_mode(
    payload: DetectionModeRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Updates the posture classification mode ('rule' or 'ml') for the authenticated user."""
    if payload.mode not in {"rule", "ml"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Use 'rule' or 'ml'.",
        )

    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    uid = str(current_user.id)
    if not worker.set_detection_mode(payload.mode, user_id=uid):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ML model not available.",
        )

    mode = worker.get_detection_mode(uid)
    return {"status": "success", "mode": mode, "message": f"Detection mode set to '{mode}'"}
