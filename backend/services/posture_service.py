"""
Posture Service
---------------
Contains posture classification logic based on
Posture Confidence Score (PCS).
"""

# -------------------------------
# CONFIGURABLE THRESHOLDS
# -------------------------------

GOOD_POSTURE_THRESHOLD = 75
WARNING_POSTURE_THRESHOLD = 55


def classify_posture(avg_pcs: float) -> str:
    """
    Classifies posture state based on average PCS.

    Args:
        avg_pcs (float): Averaged Posture Confidence Score

    Returns:
        str: Posture status label
    """

    if avg_pcs >= GOOD_POSTURE_THRESHOLD:
        return "Good Posture"

    elif avg_pcs >= WARNING_POSTURE_THRESHOLD:
        return "Posture Warning"

    else:
        return "Bad Posture"
