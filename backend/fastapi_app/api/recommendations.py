from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi_app.core.dependencies import get_current_user
from fastapi_app.database.models import PostureAnalytics, User
from fastapi_app.database.session import get_db
from fastapi_app.schemas.recommendation import RecommendationResponse


router = APIRouter(tags=["recommendations"])


@router.get("/api/llm-advice", response_model=RecommendationResponse)
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    from posture_runtime import get_posture
    from services.llm_recommendation_service import get_llm_recommendation
    from services.recommendation_service import get_rule_based_recommendations
    from analytics.user_profile import UserProfile

    analytics = db.scalar(
        select(PostureAnalytics).where(PostureAnalytics.user_id == str(current_user.id))
    )
    total_checks = analytics.total_checks if analytics else 0
    avg_pcs = (analytics.total_pcs or 0.0) / total_checks if total_checks else 0.0
    current_posture = get_posture(str(current_user.id))
    summary = {
        "avg_pcs": round(avg_pcs, 2),
        "sedentary_minutes": round(current_posture.get("sedentary_time", 0) / 60, 1),
        "text_neck_count": analytics.warning_count if analytics else 0,
    }

    try:
        advice = get_llm_recommendation(summary)
        return RecommendationResponse(
            status="success", source="llm", advice=advice, summary=summary
        )
    except Exception:
        profile = UserProfile()
        profile.text_neck_count = summary["text_neck_count"]
        recommendations = get_rule_based_recommendations(
            current_posture.get("pcs", 0),
            current_posture.get("sedentary_time", 0),
            profile,
        )
        return RecommendationResponse(
            status="success",
            source="rule-based",
            advice=" ".join(recommendations),
            summary=summary,
        )
