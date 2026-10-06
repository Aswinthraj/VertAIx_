import base64
import io
import cv2
import numpy as np
import pytest
from starlette.testclient import TestClient

from fastapi_app.core.frame_decoder import decode_base64_image, decode_image_bytes


def _create_sample_jpeg(width: int = 320, height: int = 240) -> bytes:
    """Helper to create a valid JPEG byte buffer."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    # Draw simple gradient/shapes
    img[:, :] = (100, 150, 200)
    success, encoded = cv2.imencode(".jpg", img)
    assert success
    return encoded.tobytes()


def test_frame_decoder_valid_bytes() -> None:
    jpeg_bytes = _create_sample_jpeg(320, 240)
    frame = decode_image_bytes(jpeg_bytes)
    assert isinstance(frame, np.ndarray)
    assert frame.shape == (240, 320, 3)


def test_frame_decoder_valid_base64() -> None:
    jpeg_bytes = _create_sample_jpeg(160, 120)
    b64_str = "data:image/jpeg;base64," + base64.b64encode(jpeg_bytes).decode("utf-8")
    frame = decode_base64_image(b64_str)
    assert isinstance(frame, np.ndarray)
    assert frame.shape == (120, 160, 3)


def test_frame_decoder_invalid_empty() -> None:
    with pytest.raises(ValueError, match="empty"):
        decode_image_bytes(b"")


def test_frame_decoder_invalid_corrupt() -> None:
    with pytest.raises(ValueError, match="Failed to decode"):
        decode_image_bytes(b"not-an-image-data-string")


def test_process_frame_unauthenticated_rejected(client: TestClient) -> None:
    jpeg_bytes = _create_sample_jpeg()
    response = client.post(
        "/api/posture/process-frame",
        files={"file": ("frame.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
    )
    assert response.status_code == 401


def test_process_frame_multipart_success(client: TestClient, auth_headers: dict[str, str]) -> None:
    jpeg_bytes = _create_sample_jpeg(320, 240)
    response = client.post(
        "/api/posture/process-frame",
        headers=auth_headers,
        files={"file": ("frame.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "pcs" in data
    assert "alert" in data
    assert "sedentary_time" in data
    assert "recommendations" in data
    assert "neck_angle" in data
    assert "shoulder_angle" in data
    assert "spine_angle" in data
    assert "landmarks_detected" in data


def test_process_frame_json_base64_success(client: TestClient, auth_headers: dict[str, str]) -> None:
    jpeg_bytes = _create_sample_jpeg(320, 240)
    b64_data = "data:image/jpeg;base64," + base64.b64encode(jpeg_bytes).decode("utf-8")
    response = client.post(
        "/api/posture/process-frame",
        headers=auth_headers,
        json={"image": b64_data},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"No Person", "Good Posture", "Posture Warning", "Bad Posture"}
    assert isinstance(data["pcs"], (int, float))


def test_process_frame_corrupt_payload_rejected(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/posture/process-frame",
        headers=auth_headers,
        json={"image": "invalid_base64_content!!!"},
    )
    assert response.status_code == 400


def test_websocket_in_band_auth_handshake(client: TestClient, auth_headers: dict[str, str]) -> None:
    token = auth_headers["Authorization"].split(" ")[1]
    jpeg_bytes = _create_sample_jpeg(320, 240)

    # Connect without token query param
    with client.websocket_connect("/api/posture/ws") as ws:
        # Perform in-band JWT authentication handshake
        ws.send_json({"type": "auth", "token": token})
        auth_ack = ws.receive_json()
        assert auth_ack.get("status") == "authenticated"
        assert "user_id" in auth_ack

        # Send binary frame
        ws.send_bytes(jpeg_bytes)
        response = ws.receive_json()
        assert "status" in response
        assert "pcs" in response


def test_websocket_in_band_auth_invalid_token_rejected(client: TestClient) -> None:
    with client.websocket_connect("/api/posture/ws") as ws:
        ws.send_json({"type": "auth", "token": "invalid.jwt.token"})
        response = ws.receive_json()
        assert response.get("status") == "unauthorized"


def test_websocket_query_token_fallback(client: TestClient, auth_headers: dict[str, str]) -> None:
    token = auth_headers["Authorization"].split(" ")[1]
    jpeg_bytes = _create_sample_jpeg(320, 240)

    with client.websocket_connect(f"/api/posture/ws?token={token}") as ws:
        ack = ws.receive_json()
        assert ack.get("status") == "authenticated"

        ws.send_bytes(jpeg_bytes)
        response = ws.receive_json()
        assert "status" in response
