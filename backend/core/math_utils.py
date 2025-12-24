import numpy as np
import math


def euclidean_distance(p1, p2):
    # Return 0 if any point is missing
    if p1 is None or p2 is None:
        return 0.0

    p1 = np.array(p1, dtype=float)
    p2 = np.array(p2, dtype=float)

    # Distance between two points
    return np.linalg.norm(p1 - p2)


def calculate_angle(a, b, c):
    # Return 0 if any point is missing
    if a is None or b is None or c is None:
        return 0.0

    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    c = np.array(c, dtype=float)

    ba = a - b
    bc = c - b

    # Avoid division by zero
    if np.linalg.norm(ba) == 0 or np.linalg.norm(bc) == 0:
        return 0.0

    # Cosine rule for angle
    cosine_angle = np.dot(ba, bc) / (
        np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6
    )

    return math.degrees(
        math.acos(np.clip(cosine_angle, -1.0, 1.0))
    )
