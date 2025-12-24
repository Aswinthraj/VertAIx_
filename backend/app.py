from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database
from config.database import db

# Import shared runtime data (UPDATED)
from posture_runtime import get_posture

# Import analytics tracker
from analytics.analytics_tracker import analytics_tracker

# Import history logger
from analytics.history_logger import history_logger

# Import camera loop
from camera import start_camera_loop

app = Flask(__name__)
CORS(app)  # Allow React frontend to access API

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/vertaix_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Initialize database
db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()
    print("[VertAIx] Database tables created/verified")

# -------------------------------
# API ROUTES
# -------------------------------

@app.route("/api/posture", methods=["GET"])
def posture_status():
    """
    Returns the latest posture status for a specific user.
    Firebase UID is passed from frontend via request header.
    """

    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")

    return jsonify(get_posture(user_id))


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint (useful for demo & deployment)
    """
    return jsonify({
        "status": "Backend running",
        "service": "VertAIx Backend",
        "version": "1.0"
    })


@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    """
    Returns analytics data for a specific user.
    Firebase UID is passed from frontend via request header.
    """
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    analytics_data = analytics_tracker.get_analytics(user_id)
    
    return jsonify(analytics_data)


@app.route("/api/analytics/reset", methods=["POST"])
def reset_analytics():
    """
    Reset analytics data for a specific user.
    Firebase UID is passed from frontend via request header.
    """
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    analytics_tracker.reset_user_analytics(user_id)
    
    return jsonify({
        "status": "success",
        "message": f"Analytics reset for user {user_id}"
    })


@app.route("/api/session/start", methods=["POST"])
def start_session():
    """
    Mark the start of a new user session.
    Resets the current sedentary tracker for fresh session tracking.
    Firebase UID is passed from frontend via request header.
    """
    from camera import reset_user_session
    
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    reset_user_session(user_id)
    
    return jsonify({
        "status": "success",
        "message": f"Session started for user {user_id}"
    })


@app.route("/api/session/end", methods=["POST"])
def end_session():
    """
    Mark the end of a user session and accumulate sedentary time.
    Firebase UID is passed from frontend via request header.
    """
    from camera import end_user_session
    
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    session_time = end_user_session(user_id)
    
    return jsonify({
        "status": "success",
        "message": f"Session ended for user {user_id}",
        "session_sedentary_time": session_time
    })


@app.route("/api/history", methods=["GET"])
def get_history():
    """
    Returns history log for a specific user.
    Firebase UID is passed from frontend via request header.
    Optional query parameter: limit (default 100)
    """
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    # Get limit from query parameter
    limit = request.args.get("limit", 100, type=int)
    
    history_data = history_logger.get_history(user_id, limit)
    stats = history_logger.get_history_stats(user_id)
    
    return jsonify({
        "history": history_data,
        "stats": stats
    })


@app.route("/api/history/clear", methods=["POST"])
def clear_history():
    """
    Clear history for a specific user.
    Firebase UID is passed from frontend via request header.
    """
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    history_logger.clear_history(user_id)
    
    return jsonify({
        "status": "success",
        "message": f"History cleared for user {user_id}"
    })


@app.route("/api/history/export", methods=["GET"])
def export_history():
    """
    Export history as CSV for a specific user.
    Firebase UID is passed from frontend via request header.
    """
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    csv_data = history_logger.export_to_csv(user_id)
    
    return csv_data, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': f'attachment; filename=vertaix-history-{user_id}.csv'
    }


@app.route("/api/llm-advice", methods=["GET"])
def get_llm_advice():
    """
    Generate fresh LLM recommendations based on user analytics data.
    Returns streaming-style advice for frontend display.
    """
    from services.llm_recommendation_service import get_llm_recommendation
    from services.recommendation_service import get_rule_based_recommendations
    from analytics.user_profile import UserProfile
    
    # 🔐 Get Firebase user ID (fallback for demo)
    user_id = request.headers.get("X-USER-ID", "default_user")
    
    try:
        # Get analytics data for summary
        analytics_data = analytics_tracker.get_analytics(user_id)
        current_posture = get_posture(user_id)
        
        # Prepare summary for LLM
        summary = {
            'avg_pcs': analytics_data.get('avg_pcs', 0),
            'sedentary_minutes': round(current_posture.get('sedentary_time', 0) / 60, 1),
            'text_neck_count': analytics_data.get('warning_count', 0)
        }
        
        # Try LLM first
        llm_advice = get_llm_recommendation(summary)
        
        return jsonify({
            "status": "success",
            "source": "llm",
            "advice": llm_advice,
            "summary": summary
        })
        
    except Exception as e:
        print(f"[LLM ADVICE ERROR] {e}")
        
        # Fallback to rule-based
        profile = UserProfile()
        profile.text_neck_count = analytics_data.get('warning_count', 0) if 'analytics_data' in locals() else 0
        
        fallback_recs = get_rule_based_recommendations(
            current_posture.get('pcs', 0) if 'current_posture' in locals() else 0,
            current_posture.get('sedentary_time', 0) if 'current_posture' in locals() else 0,
            profile
        )
        
        return jsonify({
            "status": "success",
            "source": "rule-based",
            "advice": " ".join(fallback_recs),
            "summary": {}
        })


# -------------------------------
# THREAD MANAGEMENT
# -------------------------------

def run_camera():
    """
    Runs the webcam + posture detection loop with Flask app context
    """
    start_camera_loop(app)


def run_flask():
    """
    Runs the Flask API server
    """
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False
    )


# -------------------------------
# MAIN ENTRY POINT
# -------------------------------

if __name__ == "__main__":
    print("[VertAIx] Starting backend services...")

    camera_thread = threading.Thread(target=run_camera, daemon=True)
    flask_thread = threading.Thread(target=run_flask, daemon=True)

    camera_thread.start()
    time.sleep(1)  # Small delay to stabilize camera
    flask_thread.start()

    camera_thread.join()
    flask_thread.join()
