from pydantic import BaseModel


class SessionResponse(BaseModel):
    status: str
    message: str
    session_sedentary_time: int | None = None
