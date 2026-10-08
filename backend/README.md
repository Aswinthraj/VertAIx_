# VertAIx FastAPI Backend

Backend service for the **VertAIx** project, built using FastAPI, PostgreSQL, SQLAlchemy, Alembic, MediaPipe, and Python-based posture detection/ML components.

---

## 1. Prerequisites

Make sure the following are installed:

* Python **3.12**
* PostgreSQL
* Git
* PowerShell

> **Why:** VertAIx uses MediaPipe `0.10.21`, which works correctly with the Python 3.12 environment used by this project.

Check Python:

```powershell
py -3.12 --version
```

Expected:

```text
Python 3.12.x
```

---

## 2. Open the Project

Open PowerShell and navigate to the project root:

```powershell
cd D:\projects\VertAIx_
```

> **Why:** All backend commands below are executed from the project root so paths such as `backend/requirements.txt` and `backend/.env` resolve correctly.

---

## 3. Create the Virtual Environment

Create the backend virtual environment using Python 3.12:

```powershell
py -3.12 -m venv fastapi_venv
```

> **Why:** The virtual environment isolates VertAIx's Python dependencies from the global Python installation.

---

## 4. Activate the Virtual Environment

```powershell
.\fastapi_venv\Scripts\Activate.ps1
```

The terminal should now show:

```text
(fastapi_venv) PS D:\projects\VertAIx_>
```

> **Why:** Activating the environment ensures Python and installed packages are taken from the VertAIx virtual environment.

---

## 5. Verify Python

```powershell
python --version
```

Expected:

```text
Python 3.12.x
```

Also verify which Python is being used:

```powershell
python -c "import sys; print(sys.executable)"
```

Expected path:

```text
D:\projects\VertAIx_\fastapi_venv\Scripts\python.exe
```

> **Why:** This prevents accidentally running the backend using the global Python installation instead of the project's virtual environment.

---

## 6. Install Backend Dependencies

Install all dependencies from the requirements file:

```powershell
python -m pip install -r backend/requirements.txt
```

> **Why:** This installs FastAPI, Uvicorn, SQLAlchemy, Alembic, PostgreSQL drivers, MediaPipe, OpenCV, NumPy, scikit-learn, and all other packages required by the backend.

### Important Dependency Versions

The following versions are intentionally used:

```text
opencv-python==4.11.0.86
mediapipe==0.10.21
numpy==1.26.4
scikit-learn==1.7.2
psycopg[binary]==3.3.6
```

> **Why:** These versions are compatible with the project's existing posture-detection/ML setup and should not be changed unnecessarily.

---

## 7. Create the Environment File

Create:

```text
backend/.env
```

Add:

```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/vertaix_db

JWT_SECRET_KEY=your-secret-key-change-in-production

GROQ_API_KEY=your_groq_api_key

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Replace:

```text
YOUR_POSTGRES_PASSWORD
```

with the actual PostgreSQL `postgres` user password.

Replace:

```text
your_groq_api_key
```

with the actual Groq API key.

> **Why:** The `.env` file stores database credentials, JWT configuration, API keys, and frontend CORS settings separately from the source code.

### Important

Do **not** commit `.env` to Git.

Make sure `.gitignore` contains:

```text
.env
backend/.env
```

> **Why:** Database passwords, JWT secrets, and API keys are sensitive credentials and should not be pushed to GitHub.

---

## 8. Start PostgreSQL

Make sure PostgreSQL is running on:

```text
localhost:5432
```

The VertAIx database should be:

```text
vertaix_db
```

If the database does not exist, create it through pgAdmin or PostgreSQL:

```sql
CREATE DATABASE vertaix_db;
```

> **Why:** Alembic and the FastAPI application need an active PostgreSQL database to store application data.

---

## 9. Set PYTHONPATH

From the project root:

```powershell
$env:PYTHONPATH="backend"
```

Verify:

```powershell
echo $env:PYTHONPATH
```

Expected:

```text
backend
```

> **Why:** The backend package is located inside the `backend` directory, so Python needs this path to correctly resolve imports such as `fastapi_app`.

---

## 10. Run Database Migrations

Run:

```powershell
python -m alembic upgrade head
```

> **Why:** Alembic applies all pending database migrations and updates the PostgreSQL schema to the latest version required by the application.

A successful migration may look like:

```text
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade ...
```

If the database is already up to date, there may be no migration messages.

### Why use `python -m alembic` instead of `alembic`?

Use:

```powershell
python -m alembic upgrade head
```

instead of:

```powershell
alembic upgrade head
```

> **Why:** `python -m alembic` guarantees that Alembic runs using the Python interpreter from `fastapi_venv`, avoiding conflicts with globally installed Python packages.

---

## 11. Start the FastAPI Server

Run:

```powershell
python -m uvicorn fastapi_app.main:app --reload --port 8000
```

> **Why:** Uvicorn runs the FastAPI application, while `--reload` automatically restarts the server when backend source files change during development.

The server should display:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

## 12. Open Swagger API Documentation

Open:

```text
http://127.0.0.1:8000/docs
```

> **Why:** FastAPI automatically generates interactive Swagger documentation, allowing you to test and inspect backend APIs directly from the browser.

---

## 13. Open ReDoc

Open:

```text
http://127.0.0.1:8000/redoc
```

> **Why:** ReDoc provides an alternative, cleaner documentation interface for viewing the available API endpoints and schemas.

---


# First-Time Setup

For a completely fresh setup, use:

```powershell
cd D:\projects\VertAIx_

py -3.12 -m venv fastapi_venv

.\fastapi_venv\Scripts\Activate.ps1

python -m pip install -r backend/requirements.txt

$env:PYTHONPATH="backend"

python -m alembic upgrade head

python -m uvicorn fastapi_app.main:app --reload --port 8000
```

> **Why:** This creates the Python environment, installs all dependencies, configures backend imports, initializes the database schema, and starts the application.

---

# Stopping the Server

Press:

```text
CTRL + C
```

> **Why:** This gracefully stops the running Uvicorn development server.

---

# Deactivating the Virtual Environment

After stopping the server:

```powershell
deactivate
```

> **Why:** This returns the terminal to the system/global Python environment.

---

# Running Tests

Activate the virtual environment first:

```powershell
.\fastapi_venv\Scripts\Activate.ps1
```

Set the Python path:

```powershell
$env:PYTHONPATH="backend"
```

Run:

```powershell
python -m pytest backend/tests -v
```

> **Why:** This runs the backend test suite and verifies that the API and backend functionality continue to work correctly.

---

# Backend URLs

| Purpose        | URL                           |
| -------------- | ----------------------------- |
| FastAPI server | `http://127.0.0.1:8000`       |
| Swagger        | `http://127.0.0.1:8000/docs`  |
| ReDoc          | `http://127.0.0.1:8000/redoc` |

---

# Project Structure

The relevant backend structure is:

```text
VertAIx_/
│
├── backend/
│   ├── fastapi_app/
│   │   ├── main.py
│   │   ├── ...
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   ├── versions/
│   │   └── ...
│   │
│   ├── tests/
│   │
│   ├── requirements.txt
│   └── .env
│
├── fastapi_venv/
│
└── ...
```

> **Why:** The backend source, database migrations, tests, environment configuration, and isolated Python environment are kept organized separately from the project root.

---


# Recommended Daily Workflow

For normal development, you only need:

```powershell
cd D:\projects\VertAIx_

.\fastapi_venv\Scripts\Activate.ps1

$env:PYTHONPATH="backend"

python -m alembic upgrade head

python -m uvicorn fastapi_app.main:app --reload --port 8000
```

> **Why:** This is the standard daily workflow after the initial setup: activate the environment, configure imports, apply any new migrations, and start the development server.

Then open:

```text
http://127.0.0.1:8000/docs
```

> **Why:** Swagger provides the quickest way to confirm that the VertAIx FastAPI backend is running and that its endpoints are available.
