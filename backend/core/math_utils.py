import numpy as np
import math


def euclidean_distance(p1, p2):
    """
    Computes Euclidean distance between two 2D points.
    """
    p1 = np.array(p1, dtype=float)
    p2 = np.array(p2, dtype=float)
    return np.linalg.norm(p1 - p2)


def calculate_angle(a, b, c):
    """
    Calculates angle (in degrees) at point 'b' formed by points a-b-c.
    Useful for future posture enhancements.
    """
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    c = np.array(c, dtype=float)

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (
        np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6
    )

    angle = math.degrees(
        math.acos(np.clip(cosine_angle, -1.0, 1.0))
    )

    return angle
