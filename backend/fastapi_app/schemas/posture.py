from pydantic import BaseModel, Field


class PostureResponse(BaseModel):
    status: str
    pcs: float
    alert: bool
    sedentary_time: int
    recommendations: list[str] = Field(default_factory=list)
    last_updated: str | None


class DetectionModeRequest(BaseModel):
    mode: str
