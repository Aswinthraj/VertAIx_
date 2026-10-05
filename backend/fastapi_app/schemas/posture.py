from pydantic import BaseModel, Field


class PostureResponse(BaseModel):
    status: str
    pcs: float
    alert: bool
    sedentary_time: int
    recommendations: list[str] = Field(default_factory=list)
    neck_angle: float = 0.0
    shoulder_angle: float = 0.0
    spine_angle: float = 0.0
    landmarks_detected: bool = False
    last_updated: str | None


class DetectionModeRequest(BaseModel):
    mode: str
