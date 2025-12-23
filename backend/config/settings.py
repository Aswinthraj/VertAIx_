"""
Global Configuration Settings for VertAIx
-----------------------------------------
All thresholds and constants are defined here
to allow easy tuning without touching logic code.
"""

# ===============================
# CAMERA SETTINGS
# ===============================

CAMERA_INDEX = 0              # Default webcam
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
TARGET_FPS = 30


# ===============================
# MEDIAPIPE SETTINGS
# ===============================

MP_MODEL_COMPLEXITY = 1       # 0 = Lite, 1 = Full
MP_SMOOTH_LANDMARKS = True
MP_MIN_DETECTION_CONF = 0.5
MP_MIN_TRACKING_CONF = 0.5


# ===============================
# VERTAIX-PSF ALGORITHM SETTINGS
# ===============================

# Temporal window size (number of frames)
PCS_WINDOW_SIZE = 30

# Posture Confidence Score thresholds
GOOD_POSTURE_THRESHOLD = 75
WARNING_POSTURE_THRESHOLD = 55

# Metric weights (used in PCS calculation)
HSD_WEIGHT = 30    # Head-Spine Deviation
SBI_WEIGHT = 25    # Shoulder Balance Index
SCR_WEIGHT = 20    # Spine Compression Ratio


# ===============================
# ALERT SETTINGS
# ===============================

# Frames of continuous bad posture to trigger alert
ALERT_FRAME_THRESHOLD = 90    # ~3 seconds at 30 FPS


# ===============================
# API SETTINGS
# ===============================

API_HOST = "0.0.0.0"
API_PORT = 5000
DEBUG_MODE = False


# ===============================
# LOGGING / FUTURE EXTENSIONS
# ===============================

ENABLE_CSV_LOGGING = False
CSV_LOG_PATH = "logs/posture_log.csv"
