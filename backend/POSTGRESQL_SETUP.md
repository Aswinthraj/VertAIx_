# PostgreSQL Setup Guide for VertAIx

## 1. Install PostgreSQL

### Windows:
1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the wizard
3. Remember your postgres user password
4. Default port: 5432

## 2. Create Database

Open **pgAdmin** or **psql** command line:

### Using psql:
```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE vertaix_db;
\q
```

### Using pgAdmin:
1. Right-click "Databases"
2. Create > Database
3. Name: `vertaix_db`
4. Save

## 3. Update Configuration

Edit `backend/.env` file:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vertaix_db
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

## 4. Install Python Dependencies

```bash
cd backend
pip install psycopg2-binary
```

## 5. Initialize Database Tables

```bash
cd backend
python init_db.py
```

This creates 3 tables:
- `users` - User accounts
- `posture_analytics` - Analytics data per user
- `posture_history` - Individual posture readings with timestamps

## 6. Run the Application

```bash
python app.py
```

## Database Schema

### posture_analytics
- id (primary key)
- user_id (string, indexed)
- good_posture_count
- warning_count
- bad_posture_count
- total_checks
- total_pcs
- session_start
- last_updated

### posture_history
- id (primary key)
- user_id (string, indexed)
- status
- pcs
- alert
- sedentary_time
- timestamp (indexed)

## Benefits of PostgreSQL

✅ **Data Persistence** - Survives server restarts
✅ **Scalability** - Can handle millions of records
✅ **ACID Compliance** - Data integrity guaranteed
✅ **Production Ready** - Suitable for deployment
✅ **Multi-user Support** - Handles concurrent access
✅ **Backup & Recovery** - Professional database features

## Troubleshooting

### Connection Error:
```
psycopg2.OperationalError: FATAL:  password authentication failed
```
**Solution:** Check your password in `.env` file

### Database doesn't exist:
```
psycopg2.OperationalError: FATAL:  database "vertaix_db" does not exist
```
**Solution:** Create database using step 2

### Port 5432 already in use:
**Solution:** Check if PostgreSQL is running, or change port in DATABASE_URL
