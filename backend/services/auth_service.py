from datetime import datetime
from flask import jsonify
from flask_jwt_extended import create_access_token, create_refresh_token
from models.user import User
from config.database import db

class AuthService:
    
    @staticmethod
    def register_user(username, email, password):
        """
        Register a new user
        """
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return {'error': 'Username already exists'}, 400
        
        if User.query.filter_by(email=email).first():
            return {'error': 'Email already registered'}, 400
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            
            # Generate tokens
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)
            
            return {
                'message': 'User registered successfully',
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }, 201
        except Exception as e:
            db.session.rollback()
            return {'error': f'Registration failed: {str(e)}'}, 500
    
    @staticmethod
    def login_user(username, password):
        """
        Login user and return JWT token
        """
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return {'error': 'Invalid username or password'}, 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return {
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }, 200
    
    @staticmethod
    def get_user_by_id(user_id):
        """
        Get user by ID
        """
        user = User.query.get(user_id)
        if user:
            return user.to_dict()
        return None
