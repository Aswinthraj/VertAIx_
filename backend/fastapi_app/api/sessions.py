from fastapi import APIRouter, Depends

from fastapi_app.core.dependencies import get_current_user
from fastapi_app.database.models import User
from fastapi_app.schemas.session import SessionResponse


router = APIRouter(tags=["sessions"])


@router.post("/api/session/start", response_model=SessionResponse)
def start_session(current_user: User = Depends(get_current_user)) -> SessionResponse:
    from fastapi_app.core.camera_worker import get_camera_worker

    worker = get_camera_worker()
    worker.set_active_user(str(current_user.id))
    worker.ensure_user_session(str(current_user.id))
    try:
        import camera

        camera.reset_user_session(str(current_user.id))
    except Exception:
        pass

    return SessionResponse(
        status="success",
        message=f"Session started for user {current_user.id}",
    )


@router.post("/api/session/end", response_model=SessionResponse)
def end_session(current_user: User = Depends(get_current_user)) -> SessionResponse:
    from fastapi_app.core.camera_worker import get_camera_worker

    session_time = get_camera_worker().end_user_session(str(current_user.id))
    try:
        import camera

        legacy_time = camera.end_user_session(str(current_user.id))
        if session_time == 0 and legacy_time > 0:
            session_time = legacy_time
    except Exception:
        pass

    return SessionResponse(
        status="success",
        message=f"Session ended for user {current_user.id}",
        session_sedentary_time=session_time,
    )
