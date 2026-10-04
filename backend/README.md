# VertAIx FastAPI Backend

## Quickstart

### 1. Installation
```powershell
python -m venv fastapi_venv
.\fastapi_venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### 2. Environment Configuration
Create `backend/.env` with your local settings:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/vertaix_db
JWT_SECRET_KEY=your-secret-key-change-in-production
GROQ_API_KEY=your_groq_api_key
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Database Migrations (Alembic)
```powershell
$env:PYTHONPATH="backend"
alembic upgrade head
```

### 4. Running FastAPI Server
```powershell
$env:PYTHONPATH="backend"
uvicorn fastapi_app.main:app --reload --port 8000
```

Interactive Swagger API Documentation is available at `http://127.0.0.1:8000/docs`.

---

## Testing

```powershell
$env:PYTHONPATH="backend"
pytest backend/tests -v
```
