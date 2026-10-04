from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from starlette.testclient import TestClient

from fastapi_app.database.models import PostureAnalytics, User


def test_get_analytics_empty(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/analytics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["good_posture_count"] == 0
    assert data["warning_count"] == 0
    assert data["bad_posture_count"] == 0
    assert data["total_checks"] == 0
    assert data["avg_pcs"] == 0.0
    assert data["good_percentage"] == 0.0


def test_get_analytics_with_data(
    client: TestClient,
    auth_headers: dict[str, str],
    test_user: User,
    db_session: Session,
) -> None:
    analytics = PostureAnalytics(
        user_id=str(test_user.id),
        good_posture_count=8,
        warning_count=1,
        bad_posture_count=1,
        total_checks=10,
        total_pcs=820.0,
        total_sedentary_time=300,
        session_start=datetime.utcnow() - timedelta(minutes=5),
    )
    db_session.add(analytics)
    db_session.commit()

    response = client.get("/api/analytics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["good_posture_count"] == 8
    assert data["warning_count"] == 1
    assert data["bad_posture_count"] == 1
    assert data["total_checks"] == 10
    assert data["avg_pcs"] == 82.0
    assert data["good_percentage"] == 80.0
    assert data["warning_percentage"] == 10.0
    assert data["bad_percentage"] == 10.0
    assert data["total_sedentary_time"] == 300
    assert data["session_duration"] >= 290


def test_reset_analytics(
    client: TestClient,
    auth_headers: dict[str, str],
    test_user: User,
    db_session: Session,
) -> None:
    analytics = PostureAnalytics(
        user_id=str(test_user.id),
        good_posture_count=5,
        total_checks=5,
        total_pcs=450.0,
    )
    db_session.add(analytics)
    db_session.commit()

    response = client.post("/api/analytics/reset", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verify reset
    get_res = client.get("/api/analytics", headers=auth_headers)
    assert get_res.json()["total_checks"] == 0
