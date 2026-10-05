import time


class SedentaryTracker:
    def __init__(self, absence_threshold_seconds: float = 60.0):
        self.start_time = None
        self.last_seen_time = None
        self.session_sedentary_time = 0
        self.absence_threshold = absence_threshold_seconds

    def update(self, person_detected=True):
        now = time.time()
        if person_detected:
            if self.start_time is None:
                self.start_time = now
            elif self.last_seen_time is not None and (now - self.last_seen_time) > self.absence_threshold:
                # User was away for more than the threshold -> new sitting session
                self.start_time = now

            self.last_seen_time = now
            self.session_sedentary_time = int(now - self.start_time)
            return self.session_sedentary_time
        else:
            if self.start_time is not None and self.last_seen_time is not None:
                if (now - self.last_seen_time) > self.absence_threshold:
                    self.start_time = None
                    self.session_sedentary_time = 0
                    return 0
                return int(self.last_seen_time - self.start_time)
            return 0

    def get_session_time(self):
        """Get the current session sedentary time"""
        return self.session_sedentary_time if self.session_sedentary_time else 0

    def end_session(self):
        """Mark end of session and return total session sedentary time"""
        if self.start_time:
            self.session_sedentary_time = int(time.time() - self.start_time)
        session_time = self.session_sedentary_time
        self.start_time = None
        self.last_seen_time = None
        self.session_sedentary_time = 0
        return session_time
