import base64
import logging
import cv2
import numpy as np

logger = logging.getLogger("vertaix.frame_decoder")

# Maximum frame size allowed in bytes (5 MB limit to prevent memory exhaustion / DoS)
MAX_FRAME_BYTES = 5 * 1024 * 1024
MAX_FRAME_WIDTH = 1920
MAX_FRAME_HEIGHT = 1080


def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Decodes raw image bytes (JPEG, PNG, WebP) into an OpenCV BGR numpy array.
    Validates payload size, channel count, and dimensions.
    """
    if not image_bytes:
        raise ValueError("Image payload is empty")

    if len(image_bytes) > MAX_FRAME_BYTES:
        raise ValueError(
            f"Image payload size ({len(image_bytes)} bytes) exceeds maximum allowed {MAX_FRAME_BYTES} bytes"
        )

    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None or frame.size == 0:
        raise ValueError("Failed to decode image from provided bytes. Invalid or unsupported format.")

    if len(frame.shape) != 3 or frame.shape[2] != 3:
        raise ValueError("Decoded image does not have 3 color channels (BGR)")

    if frame.shape[0] < 10 or frame.shape[1] < 10:
        raise ValueError(f"Image dimensions ({frame.shape[1]}x{frame.shape[0]}) are too small")
    if frame.shape[1] > MAX_FRAME_WIDTH or frame.shape[0] > MAX_FRAME_HEIGHT:
        raise ValueError(
            f"Image dimensions ({frame.shape[1]}x{frame.shape[0]}) exceed "
            f"the maximum allowed {MAX_FRAME_WIDTH}x{MAX_FRAME_HEIGHT}"
        )

    return frame


def decode_base64_image(image_str: str) -> np.ndarray:
    """
    Decodes a base64 encoded image string or data URL (e.g. data:image/jpeg;base64,...)
    into an OpenCV BGR numpy array.
    """
    if not image_str or not isinstance(image_str, str):
        raise ValueError("Image string must be a non-empty string")

    # Strip data URL prefix if present
    if "," in image_str:
        header, encoded = image_str.split(",", 1)
    else:
        encoded = image_str

    try:
        raw_bytes = base64.b64decode(encoded, validate=True)
    except Exception as exc:
        raise ValueError(f"Invalid base64 encoding: {exc}") from exc

    return decode_image_bytes(raw_bytes)
