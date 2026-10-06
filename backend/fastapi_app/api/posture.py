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

from fastapi_app.core.dependencies import get_current_user, get_optional_current_user
from fastapi_app.core.frame_decoder import decode_base64_image, decode_image_bytes
from fastapi_app.core.security import ACCESS_TOKEN_TYPE, decode_token
from fastapi_app.database.models import User
from fastapi_app.database.session import get_db
from fastapi_app.schemas.posture import (
    DetectionModeRequest,
    FrameProcessRequest,
    PostureResponse,
)

logger = logging.getLogger("vertaix.api.posture")
router = APIRouter(tags=["posture"])


@router.get("/api/posture", response_model=PostureResponse)
def get_posture_status(
    current_user: User | None = Depends(get_optional_current_user),
) -> PostureResponse:
    from posture_runtime import get_posture

    uid = str(current_user.id) if current_user else "default_user"
    return PostureResponse.model_validate(get_posture(uid))


@router.post("/api/posture/process-frame", response_model=PostureResponse)
async def process_frame_endpoint(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> PostureResponse:
    """
    HTTP Frame Processing Endpoint.
    Accepts encoded image frames (multipart/form-data or JSON base64 string),
    decodes into OpenCV BGR numpy array, and executes CameraWorker.process_frame()
    for the authenticated user.
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

    result = worker.process_frame(frame, user_id=user_id_str)
    return PostureResponse.model_validate(result)


@router.websocket("/api/posture/ws")
async def websocket_posture_endpoint(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> None:
    """
    WebSocket Frame Streaming Endpoint.
    Authenticates via JWT token query parameter.
    Receives binary/base64 frames continuously from browser, runs OpenCV/MediaPipe pipeline,
    and returns real-time JSON posture metrics.
    """
    if not token:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Missing authentication token",
        )
        return

    try:
        payload = decode_token(token, ACCESS_TOKEN_TYPE)
        user_id = int(payload["sub"])
        user = db.get(User, user_id)
        if user is None:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="User not found",
            )
            return
    except Exception as auth_err:
        logger.warning("WebSocket authentication failed: %s", auth_err)
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Invalid authentication token",
        )
        return

    await websocket.accept()
    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    user_id_str = str(user.id)
    worker.ensure_user_session(user_id_str)
    logger.info("WebSocket connected for user %s", user_id_str)

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                try:
                    frame = decode_image_bytes(raw_bytes)
                    result = worker.process_frame(frame, user_id=user_id_str)
                    await websocket.send_json(result)
                except Exception as exc:
                    await websocket.send_json({"error": str(exc), "status": "Error"})
            elif "text" in message and message["text"]:
                text_data = message["text"]
                try:
                    data = json.loads(text_data)
                    if "image" in data:
                        frame = decode_base64_image(data["image"])
                        result = worker.process_frame(frame, user_id=user_id_str)
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
                except Exception as exc:
                    await websocket.send_json({"error": str(exc), "status": "Error"})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected gracefully for user %s", user_id_str)
    except Exception as exc:
        logger.warning("WebSocket error for user %s: %s", user_id_str, exc)


@router.get("/api/detection-mode")
def get_detection_mode(
    current_user: User | None = Depends(get_optional_current_user),
) -> dict[str, str]:
    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    uid = str(current_user.id) if current_user else None
    return {"mode": worker.get_detection_mode(uid)}


@router.post("/api/set-mode")
def set_detection_mode(
    payload: DetectionModeRequest,
    current_user: User | None = Depends(get_optional_current_user),
) -> dict[str, str]:
    if payload.mode not in {"rule", "ml"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Use 'rule' or 'ml'.",
        )

    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    uid = str(current_user.id) if current_user else None
    if not worker.set_detection_mode(payload.mode, user_id=uid):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ML model not available.",
        )

    mode = worker.get_detection_mode(uid)
    return {"status": "success", "mode": mode, "message": f"Detection mode set to '{mode}'"}
