from datetime import datetime

from pydantic import BaseModel


class HistoryEntryResponse(BaseModel):
    id: int
    status: str
    pcs: float
    alert: bool
    sedentary_time: int
    timestamp: str
    time: str
    date: str


class HistoryStatsResponse(BaseModel):
    total_records: int
    good_posture_count: int
    warning_count: int
    bad_posture_count: int
    alert_count: int


class HistoryResponse(BaseModel):
    history: list[HistoryEntryResponse]
    stats: HistoryStatsResponse


class ClearHistoryResponse(BaseModel):
    status: str
    message: str


class SaveReportResponse(BaseModel):
    status: str
    message: str
    file: str
    records: int
