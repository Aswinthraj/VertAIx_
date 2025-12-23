from mediapipe import solutions

# MediaPipe Pose reference
mp_pose = solutions.pose

# We explicitly use only MediaPipe Pose landmarks 0–12
# (face + shoulders – webcam friendly)
REQUIRED_LANDMARKS = {
    "NOSE": mp_pose.PoseLandmark.NOSE.value,                 # 0
    "LEFT_EYE": mp_pose.PoseLandmark.LEFT_EYE.value,         # 2
    "RIGHT_EYE": mp_pose.PoseLandmark.RIGHT_EYE.value,       # 5
    "LEFT_EAR": mp_pose.PoseLandmark.LEFT_EAR.value,         # 7
    "RIGHT_EAR": mp_pose.PoseLandmark.RIGHT_EAR.value,       # 8
    "LEFT_SHOULDER": mp_pose.PoseLandmark.LEFT_SHOULDER.value,   # 11
    "RIGHT_SHOULDER": mp_pose.PoseLandmark.RIGHT_SHOULDER.value  # 12
}


def extract_required_landmarks(pose_landmarks, frame_width, frame_height):
    """
    Extracts MediaPipe Pose landmarks (0–12 subset)
    and converts normalized coordinates to pixel values.

    Args:
        pose_landmarks: MediaPipe pose landmarks list
        frame_width: Width of the video frame
        frame_height: Height of the video frame

    Returns:
        Dictionary of landmark_name -> (x, y)
    """

    extracted = {}

    for name, idx in REQUIRED_LANDMARKS.items():
        lm = pose_landmarks[idx]

        # Convert normalized coordinates to pixel coordinates
        x = int(lm.x * frame_width)
        y = int(lm.y * frame_height)

        extracted[name] = (x, y)

    return extracted
