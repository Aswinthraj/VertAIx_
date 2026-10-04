from typing import Any

from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    status: str
    source: str
    advice: str
    summary: dict[str, Any]
