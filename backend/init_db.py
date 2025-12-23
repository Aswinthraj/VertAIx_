"""
Initialize database tables
"""
import os
import sys
from flask import Flask
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Create minimal Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/vertaix_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')

# Import and initialize database
from config.database import db
db.init_app(app)

# Import models
from models.user import User
from models.posture_analytics import PostureAnalytics
from models.posture_history import PostureHistory

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
        print("Tables: users, posture_analytics, posture_history")
        print("✅ Database tables created successfully!")
        print("✅ User authentication system is ready!")
        print(f"✅ Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
