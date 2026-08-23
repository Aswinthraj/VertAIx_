import math

class PrimaryUserTracker:
    """
    Locks posture analysis to the primary user
    using spatial consistency (shoulder center).
    """

    def __init__(self, threshold=120):
        self.reference_center = None
        self.threshold = threshold  # pixels

    def update_and_validate(self, landmarks):
        ls = landmarks.get("LEFT_SHOULDER")
        rs = landmarks.get("RIGHT_SHOULDER")

        # Return False if landmarks are missing or invalid
        if ls is None or rs is None:
            return False

        center = (
            (ls[0] + rs[0]) // 2,
            (ls[1] + rs[1]) // 2
        )

        # First valid frame → lock user
        if self.reference_center is None:
            self.reference_center = center
            return True

        dist = math.dist(center, self.reference_center)
        return dist < self.threshold

    def reset(self):
        self.reference_center = None
