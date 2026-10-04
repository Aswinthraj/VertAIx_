import cv2
import mediapipe as mp
import time
import csv
import os
import joblib
import pandas as pd

# -------------------------------
# ML MODEL CONFIGURATION
# -------------------------------
USE_ML_MODEL = False

# Always load the ML model at startup so mode can be switched at runtime
_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "posture_model.pkl")
ml_model = None
try:
    ml_model = joblib.load(_model_path)
    print(f"[VertAIx] ML model loaded from {_model_path}")
except FileNotFoundError:
    print(f"[WARNING] ML model not found at {_model_path}. ML mode will be unavailable.")


def set_detection_mode(mode):
    """
    Switch detection mode at runtime.
    Args:
        mode: 'rule' for rule-based, 'ml' for machine-learning
    Returns:
        True if mode was set successfully, False otherwise
    """
    global USE_ML_MODEL
    if mode == 'ml':
        if ml_model is None:
            return False
        USE_ML_MODEL = True
        print("[VertAIx] Switched to ML-based detection")
    else:
        USE_ML_MODEL = False
        print("[VertAIx] Switched to rule-based detection")
    return True


def get_detection_mode():
    """Returns the current detection mode as a string."""
    return 'ml' if USE_ML_MODEL else 'rule'

# Core VertAIx imports
from core.posture_analyzer import VertAIxPSF
from core.landmark_utils import extract_required_landmarks
from core.math_utils import calculate_angle
from services.posture_service import classify_posture
from posture_runtime import update_posture

# NEW imports (added features)
from analytics.sedentary_tracker import SedentaryTracker
from analytics.user_profile import UserProfile
from analytics.analytics_tracker import analytics_tracker
from analytics.history_logger import history_logger
from analytics.primary_user_tracker import PrimaryUserTracker
from services.recommendation_service import get_recommendations

# -------------------------------
# MEDIAPIPE INITIALIZATION
# -------------------------------

mp_pose = mp.solutions.pose

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# -------------------------------
# GLOBAL STATE (module-level for API access)
# -------------------------------
sedentary_trackers = {}
user_profiles = {}
primary_user_trackers = {}

def reset_user_session(user_id):
    """
    Reset sedentary tracker for a new session (start fresh).
    Called when user opens/refreshes dashboard.
    """
    if user_id in sedentary_trackers:
        # End current session first to save time
        end_user_session(user_id)
    # Create new tracker for new session
    sedentary_trackers[user_id] = SedentaryTracker()
    # Reset primary user lock
    if user_id in primary_user_trackers:
        primary_user_trackers[user_id].reset()
    print(f"[VertAIx] New session started for user: {user_id}")

def end_user_session(user_id):
    """
    End a user session and accumulate sedentary time to database.
    Returns the total session sedentary time.
    """
    if user_id in sedentary_trackers:
        session_time = sedentary_trackers[user_id].end_session()
        if session_time > 0:
            # Add to cumulative total in database
            analytics_tracker.add_session_sedentary_time(user_id, session_time)
            print(f"[VertAIx] Session ended for user {user_id}. Sedentary time: {session_time}s")
        return session_time
    return 0

# -------------------------------
# CAMERA LOOP
# -------------------------------

def start_camera_loop(app=None):
    """
    Start camera loop with optional Flask app context for database operations
    
    Args:
        app: Flask application instance (required for database operations)
    """
    global sedentary_trackers, user_profiles
    
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[ERROR] Webcam not accessible")
        return

    analyzer = VertAIxPSF(window_size=30)
    ALERT_FRAME_THRESHOLD = 90  # ~3 seconds

    # -------------------------------
    # PER-USER STATE (Firebase-ready)
    # -------------------------------
    
    # Throttle analytics and history updates to once per second
    last_analytics_update = {}
    last_history_update = {}
    
    # Throttle recommendation updates to once per 30 seconds
    last_recommendation_update = {}
    recommendations_cache = {}

    print("[VertAIx] Camera loop started")

    # --- DATASET COLLECTION SETUP ---
    csv_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "posture_dataset.csv")
    file_exists = os.path.exists(csv_file_path)
    csv_file = open(csv_file_path, mode='a', newline='')
    csv_writer = csv.writer(csv_file)
    if not file_exists or os.path.getsize(csv_file_path) == 0:
        csv_writer.writerow(["neck_angle", "shoulder_angle", "spine_angle", "label"])
    print("[VertAIx] Dataset CSV ready: posture_dataset.csv (Press 'g'=Good, 'b'=Bad, 'q'=Quit)")

    posture_log_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "logs", "posture_log.csv"
    )
    os.makedirs(os.path.dirname(posture_log_path), exist_ok=True)
    posture_log_file = open(posture_log_path, mode='a', newline='', encoding='utf-8')
    posture_log_writer = csv.writer(posture_log_file)
    if os.path.getsize(posture_log_path) == 0:
        posture_log_writer.writerow([
            "timestamp", "user_id", "neck_angle", "shoulder_angle",
            "spine_angle", "status", "pcs", "alert", "sedentary_time"
        ])
    posture_log_file.flush()
    print(f"[VertAIx] Posture log ready: {posture_log_path}")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        height, width, _ = frame.shape

        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # DEFAULT VALUES
        status = "No Person"
        pcs = 0.0
        alert = False
        landmarks_detected = False
        current_neck_angle = 0.0
        current_shoulder_angle = 0.0
        current_spine_angle = 0.0

        # 🔐 TEMP USER (will be replaced by Firebase UID)
        user_id = "default_user"

        # Initialize per-user objects
        if user_id not in sedentary_trackers:
            sedentary_trackers[user_id] = SedentaryTracker()
            user_profiles[user_id] = UserProfile()
            primary_user_trackers[user_id] = PrimaryUserTracker()

        if results.pose_landmarks:
            # Extract only required landmarks (0–12 based)
            landmarks = extract_required_landmarks(
                results.pose_landmarks.landmark,
                width,
                height
            )

            # 🔒 Spatial consistency (PRIMARY USER LOCK)
            if not primary_user_trackers[user_id].update_and_validate(landmarks):
                continue  # Ignore other people in frame

            # --- COMPUTE RESEARCH ANGLES FOR DATASET ---
            _nose = landmarks.get("NOSE")
            _ls = landmarks.get("LEFT_SHOULDER")
            _rs = landmarks.get("RIGHT_SHOULDER")
            _le = landmarks.get("LEFT_EAR")
            _re = landmarks.get("RIGHT_EAR")

            if _nose and _ls and _rs:
                _sh_mid = ((_ls[0] + _rs[0]) / 2, (_ls[1] + _rs[1]) / 2)
                _vert_ref = (_sh_mid[0], _sh_mid[1] + 100)

                # neck_angle: forward head lean relative to vertical
                current_neck_angle = round(calculate_angle(_nose, _sh_mid, _vert_ref), 2)

                # shoulder_angle: shoulder tilt relative to vertical
                _sh_vert = (_rs[0], _rs[1] + 100)
                current_shoulder_angle = round(calculate_angle(_ls, _rs, _sh_vert), 2)

                # spine_angle: upper body inclination (ear-midpoint based)
                _ear_mid = (
                    ((_le[0] + _re[0]) / 2, (_le[1] + _re[1]) / 2)
                    if _le and _re else _nose
                )
                current_spine_angle = round(calculate_angle(_ear_mid, _sh_mid, _vert_ref), 2)

                landmarks_detected = True

            # Run VertAIx-PSF algorithm
            avg_pcs, bad_frames = analyzer.update(landmarks)

            # Classify posture
            if USE_ML_MODEL and landmarks_detected:
                input_df = pd.DataFrame(
                    [[current_neck_angle, current_shoulder_angle, current_spine_angle]],
                    columns=['neck_angle', 'shoulder_angle', 'spine_angle']
                )
                prediction = ml_model.predict(input_df)[0]
                status = "Good Posture" if prediction == "Good" else "Bad Posture"
            else:
                status = classify_posture(avg_pcs)

            pcs = avg_pcs

            if bad_frames > ALERT_FRAME_THRESHOLD:
                alert = True

            # -------------------------------
            # USER ANALYTICS & AI RECOMMENDATION
            # -------------------------------
            sedentary_time = sedentary_trackers[user_id].update(
                person_detected=True
            )

            user_profiles[user_id].update(status)

            # Generate recommendations (throttled to once per 30 seconds)
            current_time = time.time()
            if user_id not in last_recommendation_update or current_time - last_recommendation_update[user_id] >= 30.0:
                recommendations = get_recommendations(
                    pcs=pcs,
                    sedentary_seconds=sedentary_time,
                    profile=user_profiles[user_id]
                )
                recommendations_cache[user_id] = recommendations
                last_recommendation_update[user_id] = current_time
            else:
                # Use cached recommendations
                recommendations = recommendations_cache.get(user_id, [])

            # Update analytics tracker (throttled to once per second)
            if user_id not in last_analytics_update or current_time - last_analytics_update[user_id] >= 1.0:
                if app:
                    with app.app_context():
                        analytics_tracker.update(user_id, status, pcs, sedentary_time)
                else:
                    analytics_tracker.update(user_id, status, pcs, sedentary_time)
                last_analytics_update[user_id] = current_time

            # Log to history (throttled to once per second)
            if user_id not in last_history_update or current_time - last_history_update[user_id] >= 1.0:
                if app:
                    with app.app_context():
                        history_logger.log_entry(
                            user_id=user_id,
                            status=status,
                            pcs=pcs,
                            alert=alert,
                            sedentary_time=sedentary_time,
                            recommendations=recommendations
                        )
                else:
                    history_logger.log_entry(
                        user_id=user_id,
                        status=status,
                        pcs=pcs,
                        alert=alert,
                        sedentary_time=sedentary_time,
                        recommendations=recommendations
                    )
                last_history_update[user_id] = current_time

                posture_log_writer.writerow([
                    time.strftime("%Y-%m-%d %H:%M:%S"),
                    user_id,
                    current_neck_angle,
                    current_shoulder_angle,
                    current_spine_angle,
                    status,
                    round(float(pcs), 2),
                    int(alert),
                    sedentary_time
                ])
                posture_log_file.flush()

        else:
            sedentary_time = sedentary_trackers[user_id].update(
                person_detected=False
            )
            recommendations = []

        # -------------------------------
        # UPDATE SHARED RUNTIME STATE
        # -------------------------------
        update_posture(
            user_id=user_id,
            status=status,
            pcs=pcs,
            alert=alert,
            sedentary_time=sedentary_time,
            recommendations=recommendations
        )

        # -------------------------------
        # OPTIONAL: LOCAL DISPLAY (DEBUG)
        # -------------------------------
        cv2.putText(
            frame,
            f"{status} | PCS: {int(pcs)}",
            (30, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0) if status == "Good Posture" else (0, 0, 255),
            2
        )

        if landmarks_detected:
            cv2.putText(
                frame,
                f"Neck: {current_neck_angle}  Shoulder: {current_shoulder_angle}  Spine: {current_spine_angle}",
                (30, 75),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 0),
                1
            )

        cv2.imshow("VertAIx - Backend Camera", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("g") and landmarks_detected:
            csv_writer.writerow([current_neck_angle, current_shoulder_angle, current_spine_angle, "Good"])
            csv_file.flush()
            print(f"[DATASET] Saved GOOD  -> neck={current_neck_angle}, shoulder={current_shoulder_angle}, spine={current_spine_angle}")
        elif key == ord("b") and landmarks_detected:
            csv_writer.writerow([current_neck_angle, current_shoulder_angle, current_spine_angle, "Bad"])
            csv_file.flush()
            print(f"[DATASET] Saved BAD   -> neck={current_neck_angle}, shoulder={current_shoulder_angle}, spine={current_spine_angle}")
        elif key == ord("q"):
            break

    csv_file.close()
    posture_log_file.close()
    print("[VertAIx] Dataset CSV file saved and closed")
    cap.release()
    cv2.destroyAllWindows()
    print("[VertAIx] Camera loop stopped")
