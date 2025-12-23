# VertAIx Backend - Setup Instructions

## PostgreSQL Database Setup

### 1. Install PostgreSQL
Download and install PostgreSQL from: https://www.postgresql.org/download/

### 2. Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE vertaix_db;

-- Create user (optional)
CREATE USER vertaix_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vertaix_db TO vertaix_user;
```

### 3. Configure Environment Variables
Create a `.env` file in the backend directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/vertaix_db
JWT_SECRET_KEY=your-secret-key-change-this-in-production
FLASK_ENV=development
```

### 4. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 5. Run the Application
```bash
python app.py
```

The backend will automatically create the database tables on first run.

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register new user
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **GET** `/api/auth/me` - Get current user (requires JWT token)

### Posture Monitoring
- **GET** `/api/posture` - Get posture status (requires JWT token)
- **GET** `/api/health` - Health check

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp
