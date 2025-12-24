import cv2
import mediapipe as mp
import time

# Core VertAIx imports
from core.posture_analyzer import VertAIxPSF
from core.landmark_utils import extract_required_landmarks
from services.posture_service import classify_posture
from posture_runtime import update_posture

# NEW imports (added features)
from analytics.sedentary_tracker import SedentaryTracker
from analytics.user_profile import UserProfile
from analytics.analytics_tracker import analytics_tracker
from analytics.history_logger import history_logger
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

        # 🔐 TEMP USER (will be replaced by Firebase UID)
        user_id = "default_user"

        # Initialize per-user objects
        if user_id not in sedentary_trackers:
            sedentary_trackers[user_id] = SedentaryTracker()
            user_profiles[user_id] = UserProfile()

        if results.pose_landmarks:
            # Extract only required landmarks (0–12 based)
            landmarks = extract_required_landmarks(
                results.pose_landmarks.landmark,
                width,
                height
            )

            # Run VertAIx-PSF algorithm
            avg_pcs, bad_frames = analyzer.update(landmarks)

            # Classify posture
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

        cv2.imshow("VertAIx - Backend Camera", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[VertAIx] Camera loop stopped")
