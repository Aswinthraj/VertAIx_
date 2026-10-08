import concurrent.futures
import time
import cv2
import numpy as np
import pytest
from starlette.testclient import TestClient

from fastapi_app.core.security import create_access_token
from fastapi_app.database.models import User
from fastapi_app.database.session import SessionLocal
from fastapi_app.main import app


def _create_sample_jpeg(width: int = 320, height: int = 240) -> bytes:
    img = np.zeros((height, width, 3), dtype=np.uint8)
    img[:, :] = (120, 160, 200)
    _, encoded = cv2.imencode(".jpg", img)
    return encoded.tobytes()


def _ensure_test_user(user_id: int, username: str) -> str:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if not user:
            user = User(
                id=user_id,
                username=username,
                email=f"{username}@example.com",
                password_hash="testpasshash123",
            )
            db.add(user)
            db.commit()
    return create_access_token(str(user_id))


def _run_user_stream(user_id: int, num_frames: int = 15) -> dict:
    username = f"bench_user_{user_id}"
    token = _ensure_test_user(user_id, username)
    jpeg_bytes = _create_sample_jpeg(320, 240)

    latencies = []
    successes = 0

    with TestClient(app) as client:
        with client.websocket_connect("/api/posture/ws") as ws:
            # Handshake
            ws.send_json({"type": "auth", "token": token})
            ack = ws.receive_json()
            if ack.get("status") != "authenticated":
                return {"user_id": user_id, "success": 0, "latencies": []}

            for _ in range(num_frames):
                start = time.perf_counter()
                ws.send_bytes(jpeg_bytes)
                resp = ws.receive_json()
                elapsed = (time.perf_counter() - start) * 1000.0  # ms

                if "status" in resp:
                    successes += 1
                    latencies.append(elapsed)

    return {
        "user_id": user_id,
        "successes": successes,
        "latencies": latencies,
    }


def run_benchmark(concurrency: int, frames_per_user: int = 15) -> dict:
    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(_run_user_stream, 100 + i, frames_per_user)
            for i in range(concurrency)
        ]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    total_time = time.perf_counter() - start_total

    all_latencies = []
    total_successes = 0
    for r in results:
        total_successes += r["successes"]
        all_latencies.extend(r["latencies"])

    avg_latency = float(np.mean(all_latencies)) if all_latencies else 0.0
    p95_latency = float(np.percentile(all_latencies, 95)) if all_latencies else 0.0

    return {
        "concurrency": concurrency,
        "total_frames": concurrency * frames_per_user,
        "successful_frames": total_successes,
        "total_time_seconds": round(total_time, 3),
        "avg_latency_ms": round(avg_latency, 2),
        "p95_latency_ms": round(p95_latency, 2),
    }


def test_controlled_load_benchmark() -> None:
    # 1 User Test
    res1 = run_benchmark(concurrency=1, frames_per_user=10)
    assert res1["successful_frames"] == 10
    print(f"\n[Load Test 1 User] Avg: {res1['avg_latency_ms']}ms | p95: {res1['p95_latency_ms']}ms")

    # 2 Users Concurrent Test
    res2 = run_benchmark(concurrency=2, frames_per_user=10)
    assert res2["successful_frames"] == 20
    print(f"[Load Test 2 Users] Avg: {res2['avg_latency_ms']}ms | p95: {res2['p95_latency_ms']}ms")

    # 5 Users Concurrent Test
    res5 = run_benchmark(concurrency=5, frames_per_user=10)
    assert res5["successful_frames"] == 50
    print(f"[Load Test 5 Users] Avg: {res5['avg_latency_ms']}ms | p95: {res5['p95_latency_ms']}ms")


if __name__ == "__main__":
    for c in [1, 2, 5]:
        data = run_benchmark(c, frames_per_user=10)
        print(f"Concurrency {c}: {data}")
