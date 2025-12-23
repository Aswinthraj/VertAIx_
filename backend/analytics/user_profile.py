class UserProfile:
    def __init__(self):
        self.text_neck_count = 0

    def update(self, posture_status):
        if posture_status == "Posture Warning":
            self.text_neck_count += 1
