import os
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def init_db(app):
    """
    Initialize database and extensions
    """
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    with app.app_context():
        db.create_all()
