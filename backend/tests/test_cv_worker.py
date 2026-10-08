import numpy as np
import pytest

from fastapi_app.core.camera_worker import CameraWorker, get_camera_worker
from posture_runtime import get_posture


def test_camera_worker_initialization() -> None:
    worker = CameraWorker(default_mode="rule")
    assert worker.mode == "rule"
    assert worker.ml_model_loaded is True
    assert worker.is_running is False


def test_camera_worker_detection_mode_switch() -> None:
    worker = CameraWorker(default_mode="rule")
    assert worker.get_detection_mode() == "rule"

    assert worker.set_detection_mode("ml") is True
    assert worker.get_detection_mode() == "ml"

    assert worker.set_detection_mode("rule") is True
    assert worker.get_detection_mode() == "rule"

    assert worker.set_detection_mode("unsupported_mode") is False
    assert worker.get_detection_mode() == "rule"


def test_camera_worker_multi_user_isolation() -> None:
    worker = CameraWorker()
    user_a = "user_alpha"
    user_b = "user_beta"

    worker.set_detection_mode("ml", user_id=user_a)
    worker.set_detection_mode("rule", user_id=user_b)

    assert worker.get_detection_mode(user_a) == "ml"
    assert worker.get_detection_mode(user_b) == "rule"

    # User A and User B have separate analyzers and trackers
    blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker.process_frame(blank_frame, user_id=user_a)
    worker.process_frame(blank_frame, user_id=user_b)

    assert user_a in worker.analyzers
    assert user_b in worker.analyzers
    assert worker.analyzers[user_a] is not worker.analyzers[user_b]
    assert worker.sedentary_trackers[user_a] is not worker.sedentary_trackers[user_b]


def test_camera_worker_session_lifecycle() -> None:
    worker = CameraWorker()
    user_id = "test_worker_user"

    worker.reset_user_session(user_id)
    assert user_id in worker.sedentary_trackers

    session_time = worker.end_user_session(user_id)
    assert isinstance(session_time, int)
    assert session_time >= 0


def test_camera_worker_process_blank_frame() -> None:
    worker = CameraWorker()
    blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    user_id = "worker_blank_user"

    result = worker.process_frame(blank_frame, user_id=user_id)
    assert result["status"] == "No Person"
    assert result["pcs"] == 0.0
    assert result["alert"] is False
    assert result["landmarks_detected"] is False

    # Check posture_runtime was updated
    runtime_data = get_posture(user_id)
    assert runtime_data["status"] == "No Person"
    assert runtime_data["pcs"] == 0.0


def test_get_camera_worker_singleton() -> None:
    worker1 = get_camera_worker()
    worker2 = get_camera_worker()
    assert worker1 is worker2
