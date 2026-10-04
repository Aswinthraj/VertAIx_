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
        self.baseline_samples = []
        self.baseline = None

    # ------------------------------------------------
    # METRIC COMPUTATION (0–12 LANDMARKS)
    # ------------------------------------------------
    def _compute_metrics(self, landmarks):
        nose = landmarks.get("NOSE")
        ls = landmarks.get("LEFT_SHOULDER")
        rs = landmarks.get("RIGHT_SHOULDER")

        if nose is None or ls is None or rs is None:
            return None

        # Optional (from 0–12 landmarks)
        left_ear = landmarks.get("LEFT_EAR")
        right_ear = landmarks.get("RIGHT_EAR")
        nose_depth = landmarks.get("NOSE_DEPTH")
        left_shoulder_depth = landmarks.get("LEFT_SHOULDER_DEPTH")
        right_shoulder_depth = landmarks.get("RIGHT_SHOULDER_DEPTH")

        # Reference scale (normalization)
        shoulder_width = euclidean_distance(ls, rs) + 1e-6

        # Shoulder center
        shoulder_center = (
            (ls[0] + rs[0]) / 2,
            (ls[1] + rs[1]) / 2
        )

        # 1️⃣ Lateral head displacement for a front-facing webcam
        head_lateral = abs(nose[0] - shoulder_center[0]) / shoulder_width

        # 2️⃣ Shoulder Balance Index (SBI)
        sbi = abs(ls[1] - rs[1]) / shoulder_width

        # 3️⃣ Head-down displacement; upright head height is not penalized
        head_down = max(0, (nose[1] - shoulder_center[1]) / shoulder_width)

        # Forward-head displacement from MediaPipe depth. Negative z is closer
        # to the camera, so a nose closer than the shoulders indicates leaning.
        if (
            nose_depth is not None
            and left_shoulder_depth is not None
            and right_shoulder_depth is not None
        ):
            shoulder_depth = (left_shoulder_depth + right_shoulder_depth) / 2
            head_forward = max(0, (shoulder_depth - nose_depth) / shoulder_width)
        else:
            head_forward = 0.0

        # 4️⃣ Kept as a separate metric for the existing scoring interface
        head_pitch = head_down

        # 5️⃣ Head Tilt Ratio (HTR) – optional (ear symmetry)
        if left_ear and right_ear:
            htr = abs(left_ear[1] - right_ear[1]) / shoulder_width
        else:
            htr = 0.0

        return head_lateral, sbi, head_down, head_forward, head_pitch, htr

    # ------------------------------------------------
    # POSTURE CONFIDENCE SCORE (PCS)
    # ------------------------------------------------
    def _compute_pcs(self, head_lateral, sbi, head_down, head_forward, head_pitch, htr):
        # Tuned for a front-facing webcam.
        w_head_lateral = 30
        w_sbi = 20
        w_head_down = 200
        w_head_forward = 160
        w_head_pitch = 0
        w_htr = 20

        penalty = (
            w_head_lateral * head_lateral +
            w_sbi * sbi +
            w_head_down * head_down +
            w_head_forward * head_forward +
            w_head_pitch * head_pitch +
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

        metrics = self._compute_metrics(landmarks)
        if metrics is None:
            avg_pcs = float(np.mean(self.pcs_window)) if self.pcs_window else 0.0
            return avg_pcs, self.bad_posture_frames

        head_lateral, sbi, head_down, head_forward, head_pitch, htr = metrics

        # Calibrate the user's natural upper-body geometry from the first stable frames.
        current_metrics = np.array(
            [head_lateral, sbi, head_down, head_forward, htr],
            dtype=float,
        )
        if self.baseline is None:
            self.baseline_samples.append(current_metrics)
            if len(self.baseline_samples) >= 30:
                self.baseline = np.median(self.baseline_samples, axis=0)
            calibrated_metrics = np.zeros(5)
        else:
            deviations = np.abs(current_metrics - self.baseline)
            deviations[2] = max(0.0, current_metrics[2] - self.baseline[2])
            deviations[3] = max(0.0, current_metrics[3] - self.baseline[3])
            calibrated_metrics = np.maximum(0.0, deviations - np.array([
                0.05, 0.02, 0.05, 0.05, 0.02
            ]))

        pcs = self._compute_pcs(
            calibrated_metrics[0],
            calibrated_metrics[1],
            calibrated_metrics[2],
            calibrated_metrics[3],
            head_pitch,
            calibrated_metrics[4],
        )

        # Temporal smoothing
        self.pcs_window.append(pcs)
        avg_pcs = np.mean(self.pcs_window)

        # Continuous bad posture tracking
        if avg_pcs < 55:
            self.bad_posture_frames += 1
        else:
            self.bad_posture_frames = 0

        return avg_pcs, self.bad_posture_frames
