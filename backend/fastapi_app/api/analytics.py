from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from fastapi_app.core.dependencies import get_current_user
from fastapi_app.database.models import PostureAnalytics, User
from fastapi_app.database.session import get_db
from fastapi_app.schemas.analytics import AnalyticsResetResponse, AnalyticsResponse


router = APIRouter(tags=["analytics"])


def _empty_analytics() -> AnalyticsResponse:
    return AnalyticsResponse(
        good_posture_count=0,
        warning_count=0,
        bad_posture_count=0,
        total_checks=0,
        avg_pcs=0.0,
        session_duration=0,
        total_sedentary_time=0,
        good_percentage=0.0,
        warning_percentage=0.0,
        bad_percentage=0.0,
    )


def _serialize_analytics(analytics: PostureAnalytics | None) -> AnalyticsResponse:
    if analytics is None:
        return _empty_analytics()

    total = analytics.total_checks or 0
    avg_pcs = (analytics.total_pcs or 0.0) / total if total else 0.0
    session_duration = 0
    if analytics.session_start:
        session_duration = int((datetime.utcnow() - analytics.session_start).total_seconds())

    good = analytics.good_posture_count or 0
    warning = analytics.warning_count or 0
    bad = analytics.bad_posture_count or 0
    return AnalyticsResponse(
        good_posture_count=good,
        warning_count=warning,
        bad_posture_count=bad,
        total_checks=total,
        avg_pcs=round(avg_pcs, 2),
        session_duration=session_duration,
        total_sedentary_time=analytics.total_sedentary_time or 0,
        good_percentage=round(good / total * 100, 1) if total else 0.0,
        warning_percentage=round(warning / total * 100, 1) if total else 0.0,
        bad_percentage=round(bad / total * 100, 1) if total else 0.0,
    )


@router.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsResponse:
    analytics = db.query(PostureAnalytics).filter_by(user_id=str(current_user.id)).first()
    return _serialize_analytics(analytics)


@router.post("/api/analytics/reset", response_model=AnalyticsResetResponse)
def reset_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsResetResponse:
    analytics = db.query(PostureAnalytics).filter_by(user_id=str(current_user.id)).first()
    if analytics is not None:
        db.delete(analytics)
        db.commit()
    return AnalyticsResetResponse(
        status="success",
        message=f"Analytics reset for user {current_user.id}",
    )
