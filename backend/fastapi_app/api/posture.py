from fastapi import APIRouter, HTTPException, status

from fastapi_app.schemas.posture import DetectionModeRequest, PostureResponse


router = APIRouter(tags=["posture"])


@router.get("/api/posture", response_model=PostureResponse)
def get_posture_status() -> PostureResponse:
    from posture_runtime import get_posture

    return PostureResponse.model_validate(get_posture("default_user"))


@router.get("/api/detection-mode")
def get_detection_mode() -> dict[str, str]:
    from fastapi_app.core.camera_worker import get_camera_worker

    return {"mode": get_camera_worker().get_detection_mode()}


@router.post("/api/set-mode")
def set_detection_mode(payload: DetectionModeRequest) -> dict[str, str]:
    if payload.mode not in {"rule", "ml"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Use 'rule' or 'ml'.",
        )

    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    if not worker.set_detection_mode(payload.mode):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ML model not available.",
        )

    try:
        import camera

        camera.set_detection_mode(payload.mode)
    except Exception:
        pass

    mode = worker.get_detection_mode()
    return {"status": "success", "mode": mode, "message": f"Detection mode set to '{mode}'"}
