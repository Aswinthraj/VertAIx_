from mediapipe import solutions

mp_pose = solutions.pose

# Required upper-body landmarks for webcam posture
REQUIRED_LANDMARKS = {
    "NOSE": mp_pose.PoseLandmark.NOSE.value,
    "LEFT_EYE": mp_pose.PoseLandmark.LEFT_EYE.value,
    "RIGHT_EYE": mp_pose.PoseLandmark.RIGHT_EYE.value,
    "LEFT_EAR": mp_pose.PoseLandmark.LEFT_EAR.value,
    "RIGHT_EAR": mp_pose.PoseLandmark.RIGHT_EAR.value,
    "LEFT_SHOULDER": mp_pose.PoseLandmark.LEFT_SHOULDER.value,
    "RIGHT_SHOULDER": mp_pose.PoseLandmark.RIGHT_SHOULDER.value
}


def extract_required_landmarks(pose_landmarks, frame_width, frame_height):
    extracted = {}

    # Return empty if no person detected
    if pose_landmarks is None:
        return extracted

    for name, idx in REQUIRED_LANDMARKS.items():
        lm = pose_landmarks[idx]

        # Ignore unreliable landmarks
        if hasattr(lm, "visibility") and lm.visibility < 0.5:
            extracted[name] = None
            extracted[f"{name}_DEPTH"] = None
            continue

        # Convert normalized coords to pixels
        x = int(lm.x * frame_width)
        y = int(lm.y * frame_height)

        # Clamp values inside frame
        x = max(0, min(x, frame_width))
        y = max(0, min(y, frame_height))

        extracted[name] = (x, y)
        extracted[f"{name}_DEPTH"] = lm.z * frame_width

    return extracted
