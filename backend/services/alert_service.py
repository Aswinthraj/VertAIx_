"""
Alert Service
-------------
Handles alert triggering logic based on
continuous bad posture duration.
"""

# -------------------------------
# CONFIGURABLE SETTINGS
# -------------------------------

# Number of consecutive bad frames required to trigger alert
ALERT_FRAME_THRESHOLD = 90   # ~3 seconds at 30 FPS


def should_trigger_alert(bad_posture_frames: int) -> bool:
    """
    Determines whether an alert should be triggered.

    Args:
        bad_posture_frames (int): Number of continuous bad posture frames

    Returns:
        bool: True if alert should be triggered
    """
    return bad_posture_frames >= ALERT_FRAME_THRESHOLD
