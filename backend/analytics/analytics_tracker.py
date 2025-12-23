import threading
from config.database import db
from models.posture_analytics import PostureAnalytics

class AnalyticsTracker:
    """
    Tracks posture analytics per user across sessions using PostgreSQL.
    Thread-safe implementation for multi-user support.
    """
    
    def __init__(self):
        self._lock = threading.Lock()
    
    def update(self, user_id: str, status: str, pcs: float, sedentary_time: int = 0):
        """
        Update analytics for a specific user based on current posture reading.
        
        Args:
            user_id: Firebase user ID
            status: Posture status ("Good Posture", "Posture Warning", "Bad Posture")
            pcs: Posture Confidence Score
            sedentary_time: Current session sedentary time (seconds)
        """
        with self._lock:
            try:
                # Get or create analytics record for user
                analytics = PostureAnalytics.query.filter_by(user_id=user_id).first()
                
                if not analytics:
                    analytics = PostureAnalytics(user_id=user_id)
                    db.session.add(analytics)
                    db.session.flush()  # Get the ID before updating
                
                # Update counts (handle None values)
                analytics.total_checks = (analytics.total_checks or 0) + 1
                analytics.total_pcs = (analytics.total_pcs or 0.0) + float(pcs)
                
                # Update cumulative sedentary time
                analytics.total_sedentary_time = sedentary_time
                
                if status == "Good Posture":
                    analytics.good_posture_count = (analytics.good_posture_count or 0) + 1
                elif status == "Posture Warning":
                    analytics.warning_count = (analytics.warning_count or 0) + 1
                elif status == "Bad Posture":
                    analytics.bad_posture_count = (analytics.bad_posture_count or 0) + 1
                
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to update analytics: {e}")
    
    def get_analytics(self, user_id: str):
        """
        Get analytics summary for a specific user.
        
        Args:
            user_id: Firebase user ID
        
        Returns:
            Dictionary containing analytics data
        """
        with self._lock:
            try:
                analytics = PostureAnalytics.query.filter_by(user_id=user_id).first()
                
                if not analytics:
                    # Return default values if no data
                    return {
                        "good_posture_count": 0,
                        "warning_count": 0,
                        "bad_posture_count": 0,
                        "total_checks": 0,
                        "avg_pcs": 0.0,
                        "session_duration": 0,
                        "total_sedentary_time": 0,
                        "good_percentage": 0.0,
                        "warning_percentage": 0.0,
                        "bad_percentage": 0.0
                    }
                
                return analytics.to_dict()
            except Exception as e:
                print(f"[ERROR] Failed to get analytics: {e}")
                return {
                    "good_posture_count": 0,
                    "warning_count": 0,
                    "bad_posture_count": 0,
                    "total_checks": 0,
                    "avg_pcs": 0.0,
                    "session_duration": 0,
                    "total_sedentary_time": 0,
                    "good_percentage": 0.0,
                    "warning_percentage": 0.0,
                    "bad_percentage": 0.0
                }
    
    def reset_user_analytics(self, user_id: str):
        """
        Reset analytics for a specific user.
        
        Args:
            user_id: Firebase user ID
        """
        with self._lock:
            try:
                analytics = PostureAnalytics.query.filter_by(user_id=user_id).first()
                if analytics:
                    db.session.delete(analytics)
                    db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to reset analytics: {e}")


# Global analytics tracker instance
analytics_tracker = AnalyticsTracker()
