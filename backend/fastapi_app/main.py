from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi_app.api.auth import router as auth_router
from fastapi_app.api.analytics import router as analytics_router
from fastapi_app.api.history import router as history_router
from fastapi_app.api.posture import router as posture_router
from fastapi_app.api.recommendations import router as recommendations_router
from fastapi_app.api.sessions import router as sessions_router
from fastapi_app.config import get_settings
from fastapi_app.core.camera_worker import get_camera_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Server startup: Initialize camera worker (loads ML models / dependencies)
    # Physical camera is NOT started on startup for browser webcam architecture.
    get_camera_worker()
    yield
    # Server shutdown: Gracefully stop any capture threads if running
    get_camera_worker().stop()


settings = get_settings()
app = FastAPI(
    title="VertAIx API",
    version="1.0.0",
    description="FastAPI migration foundation for VertAIx.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-USER-ID"],
)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(history_router)
app.include_router(posture_router)
app.include_router(recommendations_router)
app.include_router(sessions_router)


@app.get("/api/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {
        "status": "Backend running",
        "service": "VertAIx FastAPI migration",
        "version": app.version,
    }
