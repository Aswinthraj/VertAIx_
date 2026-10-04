import csv
import io
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from fastapi_app.core.dependencies import get_current_user
from fastapi_app.database.models import PostureAnalytics, PostureHistory, User
from fastapi_app.database.session import get_db
from fastapi_app.schemas.history import (
    ClearHistoryResponse,
    HistoryEntryResponse,
    HistoryResponse,
    HistoryStatsResponse,
    SaveReportResponse,
)


router = APIRouter(tags=["history"])


def _entry_response(entry: PostureHistory) -> HistoryEntryResponse:
    timestamp = entry.timestamp or datetime.min
    return HistoryEntryResponse(
        id=entry.id,
        status=entry.status,
        pcs=round(entry.pcs, 2),
        alert=bool(entry.alert),
        sedentary_time=entry.sedentary_time or 0,
        timestamp=timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        time=timestamp.strftime("%H:%M:%S"),
        date=timestamp.strftime("%Y-%m-%d"),
    )


def _stats(db: Session, user_id: str) -> HistoryStatsResponse:
    query = select(PostureHistory).where(PostureHistory.user_id == user_id)
    entries = db.scalars(query).all()
    return HistoryStatsResponse(
        total_records=len(entries),
        good_posture_count=sum(entry.status == "Good Posture" for entry in entries),
        warning_count=sum(entry.status == "Posture Warning" for entry in entries),
        bad_posture_count=sum(entry.status == "Bad Posture" for entry in entries),
        alert_count=sum(bool(entry.alert) for entry in entries),
    )


@router.get("/api/history", response_model=HistoryResponse)
def get_history(
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HistoryResponse:
    entries = db.scalars(
        select(PostureHistory)
        .where(PostureHistory.user_id == str(current_user.id))
        .order_by(PostureHistory.timestamp.desc())
        .limit(limit)
    ).all()
    return HistoryResponse(
        history=[_entry_response(entry) for entry in entries],
        stats=_stats(db, str(current_user.id)),
    )


@router.post("/api/history/clear", response_model=ClearHistoryResponse)
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClearHistoryResponse:
    entries = db.scalars(
        select(PostureHistory).where(PostureHistory.user_id == str(current_user.id))
    ).all()
    for entry in entries:
        db.delete(entry)
    db.commit()
    return ClearHistoryResponse(
        status="success",
        message=f"History cleared for user {current_user.id}",
    )


@router.get("/api/history/export", response_class=PlainTextResponse)
def export_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlainTextResponse:
    entries = db.scalars(
        select(PostureHistory)
        .where(PostureHistory.user_id == str(current_user.id))
        .order_by(PostureHistory.timestamp.asc())
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Status", "PCS", "Alert", "Sedentary Time (s)"])
    for entry in entries:
        writer.writerow([
            entry.timestamp.strftime("%Y-%m-%d %H:%M:%S") if entry.timestamp else "",
            entry.status,
            entry.pcs,
            1 if entry.alert else 0,
            entry.sedentary_time or 0,
        ])
    return PlainTextResponse(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=vertaix-history-{current_user.id}.csv"},
    )


@router.post("/api/history/save-csv", response_model=SaveReportResponse)
def save_history_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SaveReportResponse:
    user_id = str(current_user.id)
    entries = db.scalars(
        select(PostureHistory)
        .where(PostureHistory.user_id == user_id)
        .order_by(PostureHistory.timestamp.asc())
    ).all()
    analytics = db.scalar(
        select(PostureAnalytics).where(PostureAnalytics.user_id == user_id)
    )
    logs_dir = Path(__file__).resolve().parents[2] / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    filename = f"user_details_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    filepath = logs_dir / filename
    with filepath.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["=== USER DETAILS REPORT ==="])
        writer.writerow(["User ID", user_id])
        writer.writerow(["Report Generated", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow(["Total History Records", len(entries)])
        writer.writerow([])
        if analytics is not None:
            writer.writerow(["=== ANALYTICS SUMMARY ==="])
            writer.writerow(["Total Checks", analytics.total_checks or 0])
            writer.writerow(["Average PCS", round((analytics.total_pcs or 0) / (analytics.total_checks or 1), 2)])
            writer.writerow([])
        writer.writerow(["=== POSTURE HISTORY ==="])
        writer.writerow(["Timestamp", "Status", "PCS", "Alert", "Sedentary Time (s)"])
        for entry in entries:
            writer.writerow([
                entry.timestamp.strftime("%Y-%m-%d %H:%M:%S") if entry.timestamp else "",
                entry.status,
                round(entry.pcs, 2),
                "Yes" if entry.alert else "No",
                entry.sedentary_time or 0,
            ])
    return SaveReportResponse(
        status="success",
        message=f"User details saved to {filepath}",
        file=str(filepath),
        records=len(entries),
    )
