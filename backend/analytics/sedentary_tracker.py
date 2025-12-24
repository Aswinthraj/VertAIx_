import time

class SedentaryTracker:
    def __init__(self):
        self.start_time = None
        self.session_sedentary_time = 0

    def update(self, person_detected=True):
        if not person_detected:
            self.start_time = None
            return 0

        if self.start_time is None:
            self.start_time = time.time()

        return int(time.time() - self.start_time)
    
    def get_session_time(self):
        """Get the current session sedentary time"""
        return self.session_sedentary_time if self.session_sedentary_time else 0
    
    def end_session(self):
        """Mark end of session and return total session sedentary time"""
        if self.start_time:
            self.session_sedentary_time = int(time.time() - self.start_time)
        session_time = self.session_sedentary_time
        # Reset for next session
        self.start_time = None
        self.session_sedentary_time = 0
        return session_time
