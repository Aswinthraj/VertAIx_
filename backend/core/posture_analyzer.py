import numpy as np
from collections import deque
from core.math_utils import euclidean_distance


class VertAIxPSF:
    """
    VertAIx-PSF (Posture Stability & Flow) Algorithm
    ------------------------------------------------
    Uses MediaPipe Pose landmarks 0–12 (face + shoulders)
    for webcam-based posture detection.

    Detects:
    - Forward head posture
    - Shoulder imbalance
    - Neck inclination
    - Head-down (text neck) posture
    """

    def __init__(self, window_size=30):
        self.window_size = window_size
        self.pcs_window = deque(maxlen=window_size)
        self.bad_posture_frames = 0

    # ------------------------------------------------
    # METRIC COMPUTATION (0–12 LANDMARKS)
    # ------------------------------------------------
    def _compute_metrics(self, landmarks):
        nose = landmarks["NOSE"]
        ls = landmarks["LEFT_SHOULDER"]
        rs = landmarks["RIGHT_SHOULDER"]

        # Optional (from 0–12 landmarks)
        left_ear = landmarks.get("LEFT_EAR")
        right_ear = landmarks.get("RIGHT_EAR")

        # Reference scale (normalization)
        shoulder_width = euclidean_distance(ls, rs) + 1e-6

        # Shoulder center
        shoulder_center = (
            (ls[0] + rs[0]) / 2,
            (ls[1] + rs[1]) / 2
        )

        # 1️⃣ Head Forward Ratio (HFR)
        hfr = euclidean_distance(nose, shoulder_center) / shoulder_width

        # 2️⃣ Shoulder Balance Index (SBI)
        sbi = abs(ls[1] - rs[1]) / shoulder_width

        # 3️⃣ Neck Inclination Proxy (NIP)
        nip = abs(nose[1] - shoulder_center[1]) / shoulder_width

        # 4️⃣ Head Pitch Ratio (HPR) – text neck detection
        hpr = max(0, nose[1] - shoulder_center[1]) / shoulder_width

        # 5️⃣ Head Tilt Ratio (HTR) – optional (ear symmetry)
        if left_ear and right_ear:
            htr = abs(left_ear[1] - right_ear[1]) / shoulder_width
        else:
            htr = 0.0

        return hfr, sbi, nip, hpr, htr

    # ------------------------------------------------
    # POSTURE CONFIDENCE SCORE (PCS)
    # ------------------------------------------------
    def _compute_pcs(self, hfr, sbi, nip, hpr, htr):
        # Tuned for webcam posture (0–12 landmarks)
        w_hfr = 30   # forward head
        w_sbi = 20   # shoulder imbalance
        w_nip = 15   # neck inclination
        w_hpr = 35   # head-down posture
        w_htr = 20   # head tilt

        penalty = (
            w_hfr * hfr +
            w_sbi * sbi +
            w_nip * nip +
            w_hpr * hpr +
            w_htr * htr
        )

        pcs = 100 - penalty
        return max(0, min(100, pcs))

    # ------------------------------------------------
    # UPDATE FUNCTION (TEMPORAL STABILITY)
    # ------------------------------------------------
    def update(self, landmarks):
        """
        Updates posture state using temporal smoothing.

        Returns:
        - avg_pcs
        - bad_posture_frames
        """

        hfr, sbi, nip, hpr, htr = self._compute_metrics(landmarks)
        pcs = self._compute_pcs(hfr, sbi, nip, hpr, htr)

        # Temporal smoothing
        self.pcs_window.append(pcs)
        avg_pcs = np.mean(self.pcs_window)

        # Continuous bad posture tracking
        if avg_pcs < 55:
            self.bad_posture_frames += 1
        else:
            self.bad_posture_frames = 0

        return avg_pcs, self.bad_posture_frames
