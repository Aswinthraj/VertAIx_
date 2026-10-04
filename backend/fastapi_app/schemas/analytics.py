from pydantic import BaseModel


class AnalyticsResponse(BaseModel):
    good_posture_count: int
    warning_count: int
    bad_posture_count: int
    total_checks: int
    avg_pcs: float
    session_duration: int
    total_sedentary_time: int
    good_percentage: float
    warning_percentage: float
    bad_percentage: float


class AnalyticsResetResponse(BaseModel):
    status: str
    message: str
