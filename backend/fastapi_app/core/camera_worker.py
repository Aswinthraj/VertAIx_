from __future__ import annotations

import logging
import os
from pathlib import Path
import threading
import time
from typing import Any

import cv2
import joblib
import mediapipe as mp
import numpy as np
import pandas as pd

from analytics.primary_user_tracker import PrimaryUserTracker
from analytics.sedentary_tracker import SedentaryTracker
from analytics.user_profile import UserProfile
from core.landmark_utils import extract_required_landmarks
from core.math_utils import calculate_angle
from core.posture_analyzer import VertAIxPSF
from posture_runtime import get_posture, update_posture
from services.posture_service import classify_posture
from services.recommendation_service import get_recommendations

logger = logging.getLogger("vertaix.camera_worker")


class CameraWorker:
    """
    FastAPI-compatible Camera Worker Wrapper.
    Reuses the existing MediaPipe, VertAIxPSF posture analyzer, primary-user tracker,
    sedentary tracker, and Random Forest classifier without changing the core algorithms.
    Thread-safe and decoupled from external blocking calls.
    """

    def __init__(self, model_path: Path | str | None = None) -> None:
        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._is_running = False
        self.camera_index = 0
        self.alert_frame_threshold = 90  # ~3 seconds at 30 FPS

        # Initialize MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        # Initialize Posture Analyzer
        self.analyzer = VertAIxPSF(window_size=30)

        # ML Model Configuration
        if model_path is None:
            model_path = Path(__file__).resolve().parents[2] / "posture_model.pkl"
        self.model_path = Path(model_path)
        self.ml_model: Any = None
        self.ml_model_loaded = False
        self._load_ml_model()

        # Detection mode: 'rule' or 'ml'
        self.mode: str = "rule"

        # Active user ID for real-time tracking
        self.active_user_id: str = "default_user"

        # Per-user runtime state trackers
        self.sedentary_trackers: dict[str, SedentaryTracker] = {}
        self.user_profiles: dict[str, UserProfile] = {}
        self.primary_user_trackers: dict[str, PrimaryUserTracker] = {}
        self.recommendations_cache: dict[str, list[str]] = {}
        self.last_recommendation_update: dict[str, float] = {}

    def set_active_user(self, user_id: str) -> None:
        """Sets the active user ID for continuous telemetry updates."""
        with self._lock:
            self.active_user_id = str(user_id)
            self._ensure_user_state(self.active_user_id)

    def _persist_telemetry(self, user_id: str, result: dict[str, Any]) -> None:
        """Persists periodic telemetry snapshots into PostureHistory and updates PostureAnalytics."""
        if not user_id or user_id == "default_user":
            return

        try:
            from datetime import datetime
            from fastapi_app.database.models import PostureAnalytics, PostureHistory
            from fastapi_app.database.session import SessionLocal

            with SessionLocal() as db:
                # 1. Insert PostureHistory record
                history_record = PostureHistory(
                    user_id=str(user_id),
                    status=result.get("status", "No Data"),
                    pcs=float(result.get("pcs", 0.0)),
                    alert=bool(result.get("alert", False)),
                    sedentary_time=int(result.get("sedentary_time", 0)),
                    timestamp=datetime.utcnow(),
                )
                db.add(history_record)

                # 2. Update or create PostureAnalytics record
                analytics = db.query(PostureAnalytics).filter_by(user_id=str(user_id)).first()
                if analytics is None:
                    analytics = PostureAnalytics(
                        user_id=str(user_id),
                        good_posture_count=0,
                        warning_count=0,
                        bad_posture_count=0,
                        total_checks=0,
                        total_pcs=0.0,
                        total_sedentary_time=0,
                        session_start=datetime.utcnow(),
                    )
                    db.add(analytics)

                analytics.total_checks = (analytics.total_checks or 0) + 1
                analytics.total_pcs = (analytics.total_pcs or 0.0) + float(result.get("pcs", 0.0))
                analytics.total_sedentary_time = int(result.get("sedentary_time", 0))

                status_val = result.get("status", "")
                if status_val == "Good Posture":
                    analytics.good_posture_count = (analytics.good_posture_count or 0) + 1
                elif status_val == "Posture Warning":
                    analytics.warning_count = (analytics.warning_count or 0) + 1
                elif status_val == "Bad Posture":
                    analytics.bad_posture_count = (analytics.bad_posture_count or 0) + 1

                analytics.last_updated = datetime.utcnow()
                db.commit()
        except Exception as exc:
            logger.debug("Telemetry DB logging skipped: %s", exc)

    def _load_ml_model(self) -> bool:
        if self.model_path.exists():
            try:
                self.ml_model = joblib.load(str(self.model_path))
                self.ml_model_loaded = True
                logger.info("ML model loaded from %s", self.model_path)
                return True
            except Exception as exc:
                logger.warning("Failed to load ML model from %s: %s", self.model_path, exc)
        else:
            logger.warning("ML model file not found at %s", self.model_path)
        self.ml_model = None
        self.ml_model_loaded = False
        return False

    def _ensure_user_state(self, user_id: str) -> None:
        if user_id not in self.sedentary_trackers:
            self.sedentary_trackers[user_id] = SedentaryTracker()
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserProfile()
        if user_id not in self.primary_user_trackers:
            self.primary_user_trackers[user_id] = PrimaryUserTracker()

    def set_detection_mode(self, mode: str) -> bool:
        """
        Switch detection mode at runtime ('rule' or 'ml').
        Returns True if successful, False if 'ml' requested but model unavailable.
        """
        with self._lock:
            if mode == "ml":
                if not self.ml_model_loaded or self.ml_model is None:
                    return False
                self.mode = "ml"
                return True
            elif mode == "rule":
                self.mode = "rule"
                return True
            return False

    def get_detection_mode(self) -> str:
        """Returns current detection mode ('rule' or 'ml')."""
        with self._lock:
            return self.mode

    def reset_user_session(self, user_id: str) -> None:
        """Resets the sedentary tracker and user lock for a new session."""
        with self._lock:
            self.active_user_id = str(user_id)
            if user_id in self.sedentary_trackers:
                self.sedentary_trackers[user_id].end_session()
            self.sedentary_trackers[user_id] = SedentaryTracker()
            if user_id in self.primary_user_trackers:
                self.primary_user_trackers[user_id].reset()

    def end_user_session(self, user_id: str) -> int:
        """Ends a user session and returns total session sedentary time in seconds."""
        with self._lock:
            if user_id in self.sedentary_trackers:
                return self.sedentary_trackers[user_id].end_session()
            return 0

    def process_frame(
        self, frame: np.ndarray, user_id: str = "default_user"
    ) -> dict[str, Any]:
        """
        Processes a single video frame with MediaPipe and the VertAIx PSF pipeline.
        Updates posture_runtime state thread-safely.
        """
        with self._lock:
            self._ensure_user_state(user_id)
            height, width = frame.shape[:2]

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)

            status = "No Person"
            pcs = 0.0
            alert = False
            landmarks_detected = False
            current_neck_angle = 0.0
            current_shoulder_angle = 0.0
            current_spine_angle = 0.0
            recommendations: list[str] = []

            if results.pose_landmarks:
                landmarks = extract_required_landmarks(
                    results.pose_landmarks.landmark, width, height
                )

                # Primary user lock
                if not self.primary_user_trackers[user_id].update_and_validate(landmarks):
                    # Person in frame is not the primary tracked user
                    current_posture = get_posture(user_id)
                    return {
                        "status": current_posture.get("status", "No Person"),
                        "pcs": current_posture.get("pcs", 0.0),
                        "alert": current_posture.get("alert", False),
                        "sedentary_time": current_posture.get("sedentary_time", 0),
                        "recommendations": current_posture.get("recommendations", []),
                        "neck_angle": 0.0,
                        "shoulder_angle": 0.0,
                        "spine_angle": 0.0,
                        "landmarks_detected": False,
                    }

                _nose = landmarks.get("NOSE")
                _ls = landmarks.get("LEFT_SHOULDER")
                _rs = landmarks.get("RIGHT_SHOULDER")
                _le = landmarks.get("LEFT_EAR")
                _re = landmarks.get("RIGHT_EAR")

                if _nose and _ls and _rs:
                    _sh_mid = ((_ls[0] + _rs[0]) / 2, (_ls[1] + _rs[1]) / 2)
                    _vert_ref = (_sh_mid[0], _sh_mid[1] + 100)

                    # neck_angle: forward head lean relative to vertical
                    current_neck_angle = round(
                        calculate_angle(_nose, _sh_mid, _vert_ref), 2
                    )

                    # shoulder_angle: shoulder tilt relative to vertical
                    _sh_vert = (_rs[0], _rs[1] + 100)
                    current_shoulder_angle = round(
                        calculate_angle(_ls, _rs, _sh_vert), 2
                    )

                    # spine_angle: upper body inclination (ear-midpoint based)
                    _ear_mid = (
                        ((_le[0] + _re[0]) / 2, (_le[1] + _re[1]) / 2)
                        if _le and _re
                        else _nose
                    )
                    current_spine_angle = round(
                        calculate_angle(_ear_mid, _sh_mid, _vert_ref), 2
                    )

                    landmarks_detected = True

                # Run VertAIx-PSF algorithm
                avg_pcs, bad_frames = self.analyzer.update(landmarks)

                # Posture classification
                if self.mode == "ml" and self.ml_model is not None and landmarks_detected:
                    input_df = pd.DataFrame(
                        [[current_neck_angle, current_shoulder_angle, current_spine_angle]],
                        columns=["neck_angle", "shoulder_angle", "spine_angle"],
                    )
                    prediction = self.ml_model.predict(input_df)[0]
                    status = "Good Posture" if prediction == "Good" else "Bad Posture"
                else:
                    status = classify_posture(avg_pcs)

                pcs = avg_pcs

                if bad_frames > self.alert_frame_threshold:
                    alert = True

                sedentary_time = self.sedentary_trackers[user_id].update(
                    person_detected=True
                )
                self.user_profiles[user_id].update(status)

                current_time = time.time()
                if (
                    user_id not in self.last_recommendation_update
                    or current_time - self.last_recommendation_update[user_id] >= 30.0
                ):
                    recommendations = get_recommendations(
                        pcs=pcs,
                        sedentary_seconds=sedentary_time,
                        profile=self.user_profiles[user_id],
                    )
                    self.recommendations_cache[user_id] = recommendations
                    self.last_recommendation_update[user_id] = current_time
                else:
                    recommendations = self.recommendations_cache.get(user_id, [])
            else:
                sedentary_time = self.sedentary_trackers[user_id].update(
                    person_detected=False
                )
                recommendations = []

            update_posture(
                user_id=user_id,
                status=status,
                pcs=pcs,
                alert=alert,
                sedentary_time=sedentary_time,
                recommendations=recommendations,
            )

            return {
                "status": status,
                "pcs": round(float(pcs), 2),
                "alert": alert,
                "sedentary_time": sedentary_time,
                "recommendations": recommendations,
                "neck_angle": current_neck_angle,
                "shoulder_angle": current_shoulder_angle,
                "spine_angle": current_spine_angle,
                "landmarks_detected": landmarks_detected,
            }

    def _camera_loop(
        self, camera_index: int, show_window: bool, user_id: str
    ) -> None:
        # Try DirectShow first on Windows, fallback to default backend
        cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
        if not cap.isOpened():
            cap = cv2.VideoCapture(camera_index)

        if not cap.isOpened():
            logger.warning("Webcam (index %d) not accessible. Camera worker standing by.", camera_index)
            self._is_running = False
            return

        consecutive_fails = 0
        last_db_log_time = 0.0

        try:
            while not self._stop_event.is_set():
                ret, frame = cap.read()
                if not ret or frame is None:
                    consecutive_fails += 1
                    if consecutive_fails > 60:
                        logger.warning("Camera stream dropped 60 consecutive frames. Stopping capture loop.")
                        break
                    time.sleep(0.05)
                    continue

                consecutive_fails = 0
                active_user = self.active_user_id or user_id or "default_user"
                result = self.process_frame(frame, user_id=active_user)

                # Periodic DB update (every ~1.5s) for live analytics & history
                now = time.time()
                if now - last_db_log_time >= 1.5:
                    last_db_log_time = now
                    self._persist_telemetry(active_user, result)

                if show_window:
                    cv2.putText(
                        frame,
                        f"{result['status']} | PCS: {int(result['pcs'])}",
                        (30, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.9,
                        (0, 255, 0)
                        if result["status"] == "Good Posture"
                        else (0, 0, 255),
                        2,
                    )
                    cv2.imshow("VertAIx - FastAPI Camera", frame)
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord("q"):
                        break

                # Frame rate throttling (~30 FPS)
                time.sleep(0.03)
        finally:
            cap.release()
            if show_window:
                cv2.destroyAllWindows()
            self._is_running = False
            logger.info("Camera loop stopped")

    def start(
        self,
        camera_index: int = 0,
        show_window: bool = False,
        user_id: str = "default_user",
    ) -> bool:
        """
        Starts the background camera worker thread.
        Prevents starting multiple concurrent capture threads.
        """
        with self._lock:
            self.active_user_id = str(user_id)
            if self._is_running and self._thread and self._thread.is_alive():
                return True

            self._stop_event.clear()
            self.camera_index = camera_index
            self._thread = threading.Thread(
                target=self._camera_loop,
                args=(camera_index, show_window, user_id),
                daemon=True,
                name="FastAPICameraWorkerThread",
            )
            self._is_running = True
            self._thread.start()
            return True

    def stop(self, timeout: float = 2.0) -> None:
        """Stops the camera worker thread gracefully."""
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=timeout)
        self._is_running = False

    @property
    def is_running(self) -> bool:
        """Returns True if the background camera capture thread is active."""
        return bool(self._is_running and self._thread and self._thread.is_alive())

    def get_status(self) -> dict[str, Any]:
        """Returns a snapshot of the worker state."""
        return {
            "is_running": self.is_running,
            "mode": self.get_detection_mode(),
            "ml_model_loaded": self.ml_model_loaded,
            "camera_index": self.camera_index,
            "active_user_id": self.active_user_id,
        }


# Singleton instance
_worker_instance: CameraWorker | None = None
_worker_lock = threading.Lock()


def get_camera_worker() -> CameraWorker:
    """Returns the shared CameraWorker singleton instance."""
    global _worker_instance
    with _worker_lock:
        if _worker_instance is None:
            _worker_instance = CameraWorker()
        return _worker_instance
