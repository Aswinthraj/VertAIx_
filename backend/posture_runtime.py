import threading
import time

# -------------------------------
# SHARED RUNTIME STATE (PER USER & GLOBAL)
# -------------------------------

_lock = threading.Lock()

# Dictionary to store posture data per user
# key   → user_id
# value → posture data
_posture_data = {}


def update_posture(user_id: str, status: str, pcs: float, alert: bool,
                   sedentary_time: int = 0, recommendations=None):
    """
    Updates the posture state for a specific user and global fallback.
    This function is thread-safe.
    """
    if recommendations is None:
        recommendations = []

    state = {
        "status": status,
        "pcs": round(float(pcs), 2),
        "alert": alert,
        "sedentary_time": sedentary_time,
        "recommendations": recommendations,
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with _lock:
        _posture_data[str(user_id)] = state
        _posture_data["default_user"] = state
        _posture_data["latest"] = state


def get_posture(user_id: str = "default_user"):
    """
    Returns posture data for a specific user, falling back to latest stream.
    This function is thread-safe.
    """
    with _lock:
        user_key = str(user_id)
        if user_key in _posture_data:
            return _posture_data[user_key]
        if "latest" in _posture_data:
            return _posture_data["latest"]
        if "default_user" in _posture_data:
            return _posture_data["default_user"]

        return {
            "status": "No Data",
            "pcs": 0.0,
            "alert": False,
            "sedentary_time": 0,
            "recommendations": [],
            "last_updated": None
        }
