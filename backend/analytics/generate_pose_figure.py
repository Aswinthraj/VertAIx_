import cv2
import mediapipe as mp

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Start webcam
cap = cv2.VideoCapture(0)

print("Press 's' to save image for paper")
print("Press 'q' to exit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image)

    if results.pose_landmarks:
        mp_draw.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )

    cv2.imshow("Pose Landmarks", frame)

    key = cv2.waitKey(1)

    # Save frame
    if key == ord('s'):
        cv2.imwrite("pose_landmarks_raw.png", frame)
        print("Image saved as pose_landmarks_raw.png")

    # Quit
    if key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()