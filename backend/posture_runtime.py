import threading
import time

# -------------------------------
# SHARED RUNTIME STATE (PER USER)
# -------------------------------

_lock = threading.Lock()

# Dictionary to store posture data per user
# key   → user_id (Firebase UID)
# value → posture data
_posture_data = {}

# -------------------------------
# UPDATE FUNCTION (CALLED BY camera.py)
# -------------------------------

def update_posture(user_id: str, status: str, pcs: float, alert: bool,
                   sedentary_time: int = 0, recommendations=None):
    """
    Updates the posture state for a specific user.
    This function is thread-safe.
    """

    if recommendations is None:
        recommendations = []

    with _lock:
        _posture_data[user_id] = {
            "status": status,
            "pcs": round(float(pcs), 2),
            "alert": alert,
            "sedentary_time": sedentary_time,
            "recommendations": recommendations,
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        }

# -------------------------------
# READ FUNCTION (CALLED BY app.py)
# -------------------------------

def get_posture(user_id: str):
    """
    Returns posture data for a specific user.
    This function is thread-safe.
    """

    with _lock:
        return _posture_data.get(user_id, {
            "status": "No Data",
            "pcs": 0.0,
            "alert": False,
            "sedentary_time": 0,
            "recommendations": [],
            "last_updated": None
        })
