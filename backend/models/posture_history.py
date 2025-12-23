from datetime import datetime
from config.database import db

class PostureHistory(db.Model):
    """
    Store individual posture readings with timestamps
    """
    __tablename__ = 'posture_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    
    # Posture data
    status = db.Column(db.String(50), nullable=False)
    pcs = db.Column(db.Float, nullable=False)
    alert = db.Column(db.Boolean, default=False)
    sedentary_time = db.Column(db.Integer, default=0)
    
    # Timestamps
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f'<PostureHistory user={self.user_id} status={self.status} time={self.timestamp}>'
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': self.id,
            'status': self.status,
            'pcs': round(self.pcs, 2),
            'alert': self.alert,
            'sedentary_time': self.sedentary_time,
            'timestamp': self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            'time': self.timestamp.strftime("%H:%M:%S"),
            'date': self.timestamp.strftime("%Y-%m-%d")
        }
