import csv
import os
import threading
from datetime import datetime
from config.database import db
from models.posture_history import PostureHistory
from sqlalchemy import func

class HistoryLogger:
    """
    Logs posture history per user with timestamps using PostgreSQL.
    Thread-safe implementation for multi-user support.
    """
    
    def __init__(self):
        self._lock = threading.Lock()
    
    def log_entry(self, user_id: str, status: str, pcs: float, alert: bool, 
                  sedentary_time: int = 0, recommendations=None):
        """
        Log a posture reading to history for a specific user.
        
        Args:
            user_id: Firebase user ID
            status: Posture status
            pcs: Posture Confidence Score
            alert: Whether alert is active
            sedentary_time: Time spent sedentary (seconds)
            recommendations: List of recommendations (not stored in history)
        """
        with self._lock:
            try:
                history_entry = PostureHistory(
                    user_id=user_id,
                    status=status,
                    pcs=float(pcs),  # Convert numpy float to Python float
                    alert=alert,
                    sedentary_time=sedentary_time
                )
                db.session.add(history_entry)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to log history: {e}")
    
    def get_history(self, user_id: str, limit: int = 100):
        """
        Get history entries for a specific user.
        
        Args:
            user_id: Firebase user ID
            limit: Maximum number of entries to return (most recent first)
        
        Returns:
            List of history entries, most recent first
        """
        with self._lock:
            try:
                entries = PostureHistory.query.filter_by(user_id=user_id)\
                    .order_by(PostureHistory.timestamp.desc())\
                    .limit(limit)\
                    .all()
                
                return [entry.to_dict() for entry in entries]
            except Exception as e:
                print(f"[ERROR] Failed to get history: {e}")
                return []
    
    def get_history_stats(self, user_id: str):
        """
        Get statistics from history for a specific user.
        
        Args:
            user_id: Firebase user ID
        
        Returns:
            Dictionary with history statistics
        """
        with self._lock:
            try:
                total_records = PostureHistory.query.filter_by(user_id=user_id).count()
                good_count = PostureHistory.query.filter_by(user_id=user_id, status="Good Posture").count()
                warning_count = PostureHistory.query.filter_by(user_id=user_id, status="Posture Warning").count()
                bad_count = PostureHistory.query.filter_by(user_id=user_id, status="Bad Posture").count()
                alert_count = PostureHistory.query.filter_by(user_id=user_id, alert=True).count()
                
                return {
                    "total_records": total_records,
                    "good_posture_count": good_count,
                    "warning_count": warning_count,
                    "bad_posture_count": bad_count,
                    "alert_count": alert_count
                }
            except Exception as e:
                print(f"[ERROR] Failed to get history stats: {e}")
                return {
                    "total_records": 0,
                    "good_posture_count": 0,
                    "warning_count": 0,
                    "bad_posture_count": 0,
                    "alert_count": 0
                }
    
    def clear_history(self, user_id: str):
        """
        Clear history for a specific user.
        
        Args:
            user_id: Firebase user ID
        """
        with self._lock:
            try:
                PostureHistory.query.filter_by(user_id=user_id).delete()
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Failed to clear history: {e}")
    
    def export_to_csv(self, user_id: str):
        """
        Export history to CSV format for a specific user.
        
        Args:
            user_id: Firebase user ID
        
        Returns:
            CSV string
        """
        with self._lock:
            try:
                entries = PostureHistory.query.filter_by(user_id=user_id)\
                    .order_by(PostureHistory.timestamp.asc())\
                    .all()
                
                if not entries:
                    return "No data to export"
                
                # CSV header
                csv_lines = ["Timestamp,Status,PCS,Alert,Sedentary Time (s)"]
                
                # CSV rows
                for entry in entries:
                    csv_lines.append(
                        f"{entry.timestamp.strftime('%Y-%m-%d %H:%M:%S')},{entry.status},{entry.pcs},"
                        f"{1 if entry.alert else 0},{entry.sedentary_time}"
                    )
                
                return "\n".join(csv_lines)
            except Exception as e:
                print(f"[ERROR] Failed to export history: {e}")
                return "Error exporting data"

    def save_user_details_csv(self, user_id: str, analytics_data: dict = None):
        """
        Save user details and posture history to a CSV file on disk.
        Creates a comprehensive report with user analytics summary + full history.
        
        Args:
            user_id: Firebase user ID
            analytics_data: Optional analytics summary dict
        
        Returns:
            Dictionary with status and file path
        """
        with self._lock:
            try:
                # Ensure logs directory exists
                logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
                os.makedirs(logs_dir, exist_ok=True)
                
                timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"user_details_{user_id}_{timestamp_str}.csv"
                filepath = os.path.join(logs_dir, filename)
                
                # Fetch all history entries for this user
                entries = PostureHistory.query.filter_by(user_id=user_id)\
                    .order_by(PostureHistory.timestamp.asc())\
                    .all()
                
                with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.writer(csvfile)
                    
                    # --- Section 1: User Summary ---
                    writer.writerow(['=== USER DETAILS REPORT ==='])
                    writer.writerow(['User ID', user_id])
                    writer.writerow(['Report Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
                    writer.writerow(['Total History Records', len(entries)])
                    writer.writerow([])
                    
                    # --- Section 2: Analytics Summary ---
                    if analytics_data:
                        writer.writerow(['=== ANALYTICS SUMMARY ==='])
                        writer.writerow(['Metric', 'Value'])
                        writer.writerow(['Average PCS', analytics_data.get('avg_pcs', 0)])
                        writer.writerow(['Total Checks', analytics_data.get('total_checks', 0)])
                        writer.writerow(['Good Posture Count', analytics_data.get('good_posture_count', 0)])
                        writer.writerow(['Good Posture %', f"{analytics_data.get('good_percentage', 0)}%"])
                        writer.writerow(['Warning Count', analytics_data.get('warning_count', 0)])
                        writer.writerow(['Warning %', f"{analytics_data.get('warning_percentage', 0)}%"])
                        writer.writerow(['Bad Posture Count', analytics_data.get('bad_posture_count', 0)])
                        writer.writerow(['Bad Posture %', f"{analytics_data.get('bad_percentage', 0)}%"])
                        writer.writerow(['Total Sedentary Time (s)', analytics_data.get('total_sedentary_time', 0)])
                        writer.writerow(['Session Duration (s)', analytics_data.get('session_duration', 0)])
                        writer.writerow([])
                    
                    # --- Section 3: Full Posture History ---
                    writer.writerow(['=== POSTURE HISTORY ==='])
                    writer.writerow(['Timestamp', 'Date', 'Time', 'Status', 'PCS', 'Alert', 'Sedentary Time (s)'])
                    
                    for entry in entries:
                        writer.writerow([
                            entry.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                            entry.timestamp.strftime('%Y-%m-%d'),
                            entry.timestamp.strftime('%H:%M:%S'),
                            entry.status,
                            round(entry.pcs, 2),
                            'Yes' if entry.alert else 'No',
                            entry.sedentary_time or 0
                        ])
                
                print(f"[VertAIx] User details saved to {filepath}")
                
                return {
                    'status': 'success',
                    'file': filename,
                    'path': filepath,
                    'records': len(entries)
                }
                
            except Exception as e:
                print(f"[ERROR] Failed to save user details CSV: {e}")
                return {
                    'status': 'error',
                    'message': str(e)
                }


# Global history logger instance
history_logger = HistoryLogger()

