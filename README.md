# VertAIx — Real-Time AI Posture Monitoring & Telemetry

VertAIx is an intelligent ergonomic posture analysis and telemetry platform. It utilizes computer vision, MediaPipe pose landmark tracking, and machine learning (Random Forest classification) to analyze sitting alignment in real time via standard webcam video streams.

---

## 🏗️ Architecture

```text
React Dashboard (Frontend)
         ↓  [JWT Bearer Auth & REST Telemetry]
FastAPI Server (Backend)
         ↓
Services & Infrastructure
  ├── PostgreSQL (SQLAlchemy 2.0 & Alembic Migrations)
  ├── OpenCV & MediaPipe (Posture Landmark Extraction)
  ├── VertAIx-PSF & Random Forest Model (Classification)
  └── Groq Cloud LLM API (Adaptive Ergonomic Recommendations)
```

---

## 🚀 Features

- **Real-Time Computer Vision Pipeline**: MediaPipe upper-body pose estimation (landmarks 0–12) with spatial primary-user lock.
- **Hybrid Posture Classification**:
  - **Rule-Based Mode (VertAIx-PSF)**: Geometric posture confidence scoring with temporal smoothing.
  - **Machine Learning Mode**: Pre-trained Random Forest classifier trained on 2,000+ real-world calibrated frames (`neck_angle`, `shoulder_angle`, `spine_angle`).
- **Telemetry & Ergonomics**:
  - Live Posture Confidence Score (PCS 0–100)
  - Sedentary duration tracking and deviation alerts
  - Session lifecycle tracking and CSV export
- **AI Recommendation Engine**: Live ergonomic suggestions via Groq Cloud LLMs with automated rule-based fallback.
- **Enterprise-Grade Security**:
  - FastAPI asynchronous backend
  - JWT token authentication (15-minute access token + 30-day single-use rotating refresh token)
  - Bcrypt password hashing
  - Automated Alembic schema migrations

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic v2, Python-Jose, Passlib/Bcrypt
- **Computer Vision & ML**: OpenCV, MediaPipe, NumPy, Pandas, Scikit-learn, Joblib
- **Database**: PostgreSQL
- **Frontend**: React 19, Lucide Icons, Recharts, React Toastify, Modern Vanilla CSS Design System

---

## 📂 Repository Layout

```text
VertAIx/
├── alembic.ini                   # Alembic configuration
├── backend/
│   ├── alembic/                  # Versioned schema migrations
│   │   └── versions/
│   │       ├── be754650c228_baseline_existing_schema.py
│   │       └── d5406746b9cb_add_refresh_tokens.py
│   ├── analytics/                # Trackers (sedentary, user profile, primary user)
│   ├── core/                     # Posture analysis (VertAIxPSF, math, landmarks)
│   ├── fastapi_app/              # FastAPI Application Package
│   │   ├── api/                  # Routes (auth, posture, analytics, history, sessions, recommendations)
│   │   ├── core/                 # Security, dependencies, camera worker
│   │   ├── database/             # SQLAlchemy Base, Session, and Models
│   │   ├── schemas/              # Pydantic v2 Request/Response schemas
│   │   ├── config.py             # Settings from environment
│   │   └── main.py               # FastAPI entry point & CORS
│   ├── model_verification/       # ML training scripts and research datasets
│   ├── services/                 # Recommendation and posture classification services
│   ├── tests/                    # Comprehensive backend pytest suite (66 tests)
│   ├── posture_model.pkl         # Trained Random Forest classifier
│   └── requirements.txt          # Python dependencies
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/           # Navbar, ProtectedRoute
│   │   ├── context/              # AuthContext (JWT)
│   │   ├── pages/                # Dashboard, Analytics, History, Settings, About, Login, Register
│   │   └── services/             # API client with automatic token refresh
│   └── package.json
├── .env.example                  # Environment configuration template
└── README.md
```

---

## ⚙️ Quickstart Guide

### 1. Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL running locally or accessible via network

---

### 2. Backend Setup

1. **Create and activate a virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies:**
   ```powershell
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables:**
   Create `backend/.env` (copy from `.env.example`):
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/vertaix_db
   JWT_SECRET_KEY=your-secure-random-jwt-secret
   GROQ_API_KEY=your_groq_api_key
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

4. **Apply Database Migrations:**
   ```powershell
   $env:PYTHONPATH="backend"
   alembic upgrade head
   ```

5. **Start the FastAPI Server:**
   ```powershell
   $env:PYTHONPATH="backend"
   uvicorn fastapi_app.main:app --reload --port 8000
   ```

   Interactive OpenAPI Swagger docs will be available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

1. **Install dependencies:**
   ```powershell
   cd frontend
   npm install
   ```

2. **Start the React dev server:**
   ```powershell
   npm start
   ```

   The application will open at `http://localhost:3000`.

---

## 🧪 Running Tests

### Backend Test Suite (Pytest)
```powershell
$env:PYTHONPATH="backend"
pytest backend/tests -v
```

### Frontend Test Suite (Jest)
```powershell
cd frontend
npm test -- --watchAll=false
```

### Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## 🔒 Security & Privacy

- Video frames are processed locally in real time and are **never transmitted** to external servers.
- Passwords are salted and hashed with bcrypt.
- JWT tokens use short-lived access tokens (15 minutes) with single-use rotating refresh tokens stored as SHA-256 hashes in PostgreSQL.
