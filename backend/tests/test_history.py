from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from starlette.testclient import TestClient

from fastapi_app.database.models import PostureHistory, User


def test_get_history_empty(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/history", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["history"] == []
    assert data["stats"]["total_records"] == 0


def test_get_history_with_entries(
    client: TestClient,
    auth_headers: dict[str, str],
    test_user: User,
    db_session: Session,
) -> None:
    entry1 = PostureHistory(
        user_id=str(test_user.id),
        status="Good Posture",
        pcs=90.0,
        alert=False,
        sedentary_time=60,
        timestamp=datetime(2026, 10, 4, 10, 0, 0),
    )
    entry2 = PostureHistory(
        user_id=str(test_user.id),
        status="Bad Posture",
        pcs=40.0,
        alert=True,
        sedentary_time=120,
        timestamp=datetime(2026, 10, 4, 10, 1, 0),
    )
    db_session.add_all([entry1, entry2])
    db_session.commit()

    response = client.get("/api/history?limit=10", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["history"]) == 2
    assert data["stats"]["total_records"] == 2
    assert data["stats"]["good_posture_count"] == 1
    assert data["stats"]["bad_posture_count"] == 1
    assert data["stats"]["alert_count"] == 1


def test_clear_history(
    client: TestClient,
    auth_headers: dict[str, str],
    test_user: User,
    db_session: Session,
) -> None:
    entry = PostureHistory(
        user_id=str(test_user.id),
        status="Good Posture",
        pcs=95.0,
        alert=False,
        sedentary_time=30,
        timestamp=datetime.utcnow(),
    )
    db_session.add(entry)
    db_session.commit()

    response = client.post("/api/history/clear", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verify cleared
    get_res = client.get("/api/history", headers=auth_headers)
    assert len(get_res.json()["history"]) == 0


def test_export_history_csv(
    client: TestClient,
    auth_headers: dict[str, str],
    test_user: User,
    db_session: Session,
) -> None:
    entry = PostureHistory(
        user_id=str(test_user.id),
        status="Good Posture",
        pcs=85.0,
        alert=False,
        sedentary_time=45,
        timestamp=datetime(2026, 10, 4, 12, 0, 0),
    )
    db_session.add(entry)
    db_session.commit()

    response = client.get("/api/history/export", headers=auth_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment; filename=vertaix-history-" in response.headers["content-disposition"]
    content = response.text
    assert "Timestamp,Status,PCS,Alert,Sedentary Time (s)" in content
    assert "Good Posture,85.0,0,45" in content


def test_save_history_csv_report(
    client: TestClient,
    auth_headers: dict[str, str],
    test_user: User,
    db_session: Session,
) -> None:
    entry = PostureHistory(
        user_id=str(test_user.id),
        status="Good Posture",
        pcs=88.0,
        alert=False,
        sedentary_time=50,
        timestamp=datetime.utcnow(),
    )
    db_session.add(entry)
    db_session.commit()

    response = client.post("/api/history/save-csv", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["records"] == 1
    assert "file" in data
    assert Path(data["file"]).exists()
