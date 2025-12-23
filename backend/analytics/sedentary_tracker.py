import time

class SedentaryTracker:
    def __init__(self):
        self.start_time = None

    def update(self, person_detected=True):
        if not person_detected:
            self.start_time = None
            return 0

        if self.start_time is None:
            self.start_time = time.time()

        return int(time.time() - self.start_time)
