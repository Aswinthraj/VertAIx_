import argparse
import csv
import sys
import time
from pathlib import Path

import cv2
import mediapipe as mp


BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from core.landmark_utils import extract_required_landmarks
from core.math_utils import calculate_angle
from core.posture_analyzer import VertAIxPSF
from services.posture_service import classify_posture


def calculate_features(landmarks):
    nose = landmarks.get("NOSE")
    left_shoulder = landmarks.get("LEFT_SHOULDER")
    right_shoulder = landmarks.get("RIGHT_SHOULDER")
    left_ear = landmarks.get("LEFT_EAR")
    right_ear = landmarks.get("RIGHT_EAR")

    if nose is None or left_shoulder is None or right_shoulder is None:
        return None

    shoulder_midpoint = (
        (left_shoulder[0] + right_shoulder[0]) / 2,
        (left_shoulder[1] + right_shoulder[1]) / 2,
    )
    vertical_reference = (shoulder_midpoint[0], shoulder_midpoint[1] + 100)
    neck_angle = calculate_angle(nose, shoulder_midpoint, vertical_reference)

    shoulder_vertical = (right_shoulder[0], right_shoulder[1] + 100)
    shoulder_angle = calculate_angle(
        left_shoulder, right_shoulder, shoulder_vertical
    )

    ear_midpoint = (
        ((left_ear[0] + right_ear[0]) / 2, (left_ear[1] + right_ear[1]) / 2)
        if left_ear is not None and right_ear is not None
        else nose
    )
    spine_angle = calculate_angle(
        ear_midpoint, shoulder_midpoint, vertical_reference
    )
    return tuple(round(value, 2) for value in (neck_angle, shoulder_angle, spine_angle))


def main():
    parser = argparse.ArgumentParser(description="Collect a fresh real webcam posture dataset")
    parser.add_argument("--target", type=int, default=2000)
    parser.add_argument(
        "--mode",
        choices=("manual", "auto"),
        default="manual",
        help="manual uses g/b labels; auto uses the existing posture rules",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=BACKEND_DIR / "model_verification" / "posture_dataset_real_2000.csv",
    )
    args = parser.parse_args()
    if args.target <= 0:
        raise ValueError("--target must be greater than zero")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    pose = mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        raise RuntimeError("Webcam could not be opened")

    analyzer = VertAIxPSF(window_size=30)
    rows = []
    label_counts = {"Good": 0, "Bad": 0}
    frame_number = 0
    last_auto_save = 0.0
    if args.mode == "manual":
        print("Press g for Good, b for Bad, q to quit. Only detected poses are saved.")
    else:
        print("Auto mode uses VertAIx rules. Press q to quit.")
    try:
        while len(rows) < args.target:
            success, frame = camera.read()
            if not success:
                continue

            height, width = frame.shape[:2]
            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            landmarks = extract_required_landmarks(
                results.pose_landmarks.landmark if results.pose_landmarks else None,
                width,
                height,
            )
            features = calculate_features(landmarks)
            frame_number += 1
            count_text = f"Saved: {len(rows)}/{args.target}"
            cv2.putText(frame, count_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            instruction = "g=Good  b=Bad  q=Quit" if args.mode == "manual" else "auto rules  q=Quit"
            cv2.putText(frame, instruction, (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            cv2.putText(
                frame,
                f"Good: {label_counts['Good']}  Bad: {label_counts['Bad']}",
                (20, 105),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2,
            )
            cv2.imshow("Real Posture Dataset Collector", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if features is None:
                continue

            if args.mode == "manual":
                if key not in (ord("g"), ord("b")):
                    continue
                label = "Good" if key == ord("g") else "Bad"
            else:
                now = time.monotonic()
                if frame_number % 15 != 0 or now - last_auto_save < 0.4:
                    continue
                landmarks_for_analysis = {
                    name: value
                    for name, value in landmarks.items()
                    if value is not None
                }
                if not all(
                    name in landmarks_for_analysis
                    for name in ("NOSE", "LEFT_SHOULDER", "RIGHT_SHOULDER")
                ):
                    continue
                average_pcs, _ = analyzer.update(landmarks_for_analysis)
                label = "Good" if classify_posture(average_pcs) == "Good Posture" else "Bad"
                last_auto_save = now

            rows.append((*features, label))
            label_counts[label] += 1
            print(f"Saved {len(rows)}/{args.target}: {label} {features}")
    finally:
        camera.release()
        pose.close()
        cv2.destroyAllWindows()

    with args.output.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["neck_angle", "shoulder_angle", "spine_angle", "label"])
        writer.writerows(rows)
    print(f"Saved {len(rows)} real labelled samples to {args.output}")
    print(f"Label counts: Good={label_counts['Good']}, Bad={label_counts['Bad']}")


if __name__ == "__main__":
    main()