from datetime import datetime
from config.database import db

class PostureAnalytics(db.Model):
    """
    Store analytics data per user session
    """
    __tablename__ = 'posture_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    
    # Counters
    good_posture_count = db.Column(db.Integer, default=0)
    warning_count = db.Column(db.Integer, default=0)
    bad_posture_count = db.Column(db.Integer, default=0)
    total_checks = db.Column(db.Integer, default=0)
    
    # Aggregates
    total_pcs = db.Column(db.Float, default=0.0)
    total_sedentary_time = db.Column(db.Integer, default=0)  # Total seconds across all sessions
    
    # Session tracking
    session_start = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<PostureAnalytics user={self.user_id} total_checks={self.total_checks}>'
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        avg_pcs = (self.total_pcs / self.total_checks) if self.total_checks > 0 else 0.0
        
        # Calculate session duration
        session_duration = 0
        if self.session_start:
            session_duration = int((datetime.utcnow() - self.session_start).total_seconds())
        
        # Calculate percentages
        total = self.total_checks
        good_percentage = (self.good_posture_count / total * 100) if total > 0 else 0.0
        warning_percentage = (self.warning_count / total * 100) if total > 0 else 0.0
        bad_percentage = (self.bad_posture_count / total * 100) if total > 0 else 0.0
        
        return {
            'good_posture_count': self.good_posture_count,
            'warning_count': self.warning_count,
            'bad_posture_count': self.bad_posture_count,
            'total_checks': self.total_checks,
            'avg_pcs': round(avg_pcs, 2),
            'session_duration': session_duration,
            'total_sedentary_time': self.total_sedentary_time or 0,
            'good_percentage': round(good_percentage, 1),
            'warning_percentage': round(warning_percentage, 1),
            'bad_percentage': round(bad_percentage, 1)
        }
