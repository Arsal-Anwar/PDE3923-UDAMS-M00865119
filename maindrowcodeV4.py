#Universal Diver Alertness and Monitoring System.
#Final Year Project, Muhammad Arsal Anwar - M00865119, PDE3823.

import cv2
import dlib
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore
from scipy.spatial import distance as dist
from imutils import face_utils
import time
import argparse
import pyttsx3
from threading import Thread
import pygame


ap = argparse.ArgumentParser()
ap.add_argument("-w", "--webcam", type=int, default=0,
                help="Webcam index (default 0)")
# IR mode always enabled
args = vars(ap.parse_args())


# facial points configuration
(lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
(rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]
(mStart, mEnd) = face_utils.FACIAL_LANDMARKS_IDXS["mouth"]

# firebase configuration
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# thresholds
DEFAULT_EYE_AR_THRESH = 0.20
EYE_AR_CONSEC_FRAMES = 20
YAWN_THRESH = 25
RESOLUTION = (640, 480)
ALARM_COOLDOWN = 5.0
ALERT_FILE = "alert.mp3"

# global states
COUNTER = 0
ALARM_ACTIVE = False
LAST_ALARM_TIME = 0
FIRST_ALERT = True
ACTIVE_THRESHOLD = DEFAULT_EYE_AR_THRESH
active_uid = None

pygame.mixer.init()
print("[Welcome to UDAMS]")
print("[INFO] Loading facial landmark predictor...")
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
engine = pyttsx3.init()
engine.setProperty('rate', 150)

# firebase listeners function
def listen_for_active_user():
    global active_uid
    doc_ref = db.collection('settings').document('currentUser')

    def on_user_snapshot(doc_snapshot, changes, read_time):
        global active_uid
        for doc in doc_snapshot:
            data = doc.to_dict()
            if data and 'uid' in data and data['uid']:
                if active_uid != data['uid']:
                    active_uid = data['uid']
                    print(f"[FIREBASE] Active user updated to: {active_uid}")
            else:
                if active_uid is not None:
                    print("[FIREBASE] Active user cleared. User signed out.")
                active_uid = None

    doc_ref.on_snapshot(on_user_snapshot)

def setup_firebase_listener(user_id):
    global ACTIVE_THRESHOLD
    def on_snapshot(doc_snapshot, changes, read_time):
        global ACTIVE_THRESHOLD
        for change in changes:
            if change.type.name == 'MODIFIED':
                data = change.document.to_dict()
                ACTIVE_THRESHOLD = data.get('threshold', DEFAULT_EYE_AR_THRESH)
                print(f"[FIREBASE] Updated threshold to: {ACTIVE_THRESHOLD}")
    users_ref = db.collection('users').document(user_id)
    watch = users_ref.on_snapshot(on_snapshot)
    return watch

# detection function
def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)

def lip_distance(landmarks):
    top_lip = np.concatenate((landmarks[50:53], landmarks[61:64]))
    bottom_lip = np.concatenate((landmarks[56:59], landmarks[65:68]))
    return abs(np.mean(top_lip[:, 1]) - np.mean(bottom_lip[:, 1]))

def draw_landmarks(frame, landmarks):
    for (x, y) in landmarks:
        cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

# system alert function
def play_alert():
    try:
        pygame.mixer.music.load(ALERT_FILE)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
    except Exception as e:
        print(f"Audio error: {str(e)}")
        engine.say("Alert! Wake up!")
        engine.runAndWait()

def log_alert(event_type, severity):
    try:
        print("Logging alert for user:", active_uid)
        doc_ref = db.collection('alerts').document()
        doc_ref.set({
            'timestamp': firestore.SERVER_TIMESTAMP,
            'userId': active_uid,
            'type': event_type,
            'severity': severity,
            'threshold': ACTIVE_THRESHOLD
        })
    except Exception as e:
        print(f"[FIREBASE ERROR] Failed to log alert: {str(e)}")

def alarm_handler(msg, event_type, severity):
    global ALARM_ACTIVE, LAST_ALARM_TIME, FIRST_ALERT
    if time.time() - LAST_ALARM_TIME > ALARM_COOLDOWN:
        ALARM_ACTIVE = True
        try:
            if FIRST_ALERT:
                play_alert()
                FIRST_ALERT = False
            else:
                engine.say(msg)
                engine.runAndWait()
            log_alert(event_type, severity)
        except Exception as e:
            print(f"Alert error: {str(e)}")
        ALARM_ACTIVE = False
        LAST_ALARM_TIME = time.time()

# main detection loop
def main():
    global active_uid, COUNTER, ALARM_ACTIVE, LAST_ALARM_TIME, FIRST_ALERT
    exit_requested = False
    # first face detect timestamp started
    last_face_detected = time.time()
    face_missing_alert_sent = False
    # check if a face was ever detected
    face_detected_once = False

    # always on IR mode
    listen_for_active_user()

    while not exit_requested:
        print("Waiting for user to login...")
        while active_uid is None:
            print("[INFO] No active user. Please sign in.")
            time.sleep(2)
        print(f"[INFO] Active user detected: {active_uid}")

        firebase_watch = setup_firebase_listener(active_uid)
        COUNTER = 0
        ALARM_ACTIVE = False
        LAST_ALARM_TIME = 0
        FIRST_ALERT = True
        # face detection timer reset for each detection session
        last_face_detected = time.time()
        face_missing_alert_sent = False
        # reset face_detected_once for the new session
        face_detected_once = False

        print(f"[INFO] Starting video stream with active user: {active_uid}")
        vs = cv2.VideoCapture(args["webcam"])
        vs.set(cv2.CAP_PROP_FRAME_WIDTH, RESOLUTION[0])
        vs.set(cv2.CAP_PROP_FRAME_HEIGHT, RESOLUTION[1])
        time.sleep(2.0)

        try:
            while True:
                if active_uid is None:
                    print("[INFO] Active user signed out. Waiting for new login.")
                    break

                ret, frame = vs.read()
                if not ret:
                    print("[ERROR] Failed to capture frame")
                    time.sleep(1)
                    continue

                # process frame as IR:
                if len(frame.shape) == 3:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                else:
                    gray = frame.copy()
                gray = cv2.equalizeHist(gray)
                # convert processed gray back to BGR for overlays
                display_frame = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

                faces = detector(gray, 0)

                if len(faces) > 0:
                    # set flag when face is detected
                    face_detected_once = True
                    last_face_detected = time.time()
                    face_missing_alert_sent = False

                    for face in faces:
                        landmarks = predictor(gray, face)
                        landmarks = face_utils.shape_to_np(landmarks)
                        draw_landmarks(display_frame, landmarks)

                        left_eye = landmarks[lStart:lEnd]
                        right_eye = landmarks[rStart:rEnd]
                        ear = (eye_aspect_ratio(left_eye) + eye_aspect_ratio(right_eye)) / 2.0
                        lip_dist = lip_distance(landmarks)

                        if ear < ACTIVE_THRESHOLD:
                            COUNTER += 1
                            if COUNTER >= EYE_AR_CONSEC_FRAMES and not ALARM_ACTIVE:
                                t = Thread(target=alarm_handler,
                                           args=("Driver alert! Wake up!", "drowsiness", ear))
                                t.daemon = True
                                t.start()
                                cv2.putText(display_frame, "DROWSINESS ALERT!", (10, 30),
                                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
                        else:
                            COUNTER = 0

                        if lip_dist > YAWN_THRESH and not ALARM_ACTIVE:
                            t = Thread(target=alarm_handler,
                                       args=("Take a break! Fresh air needed!", "yawn", lip_dist))
                            t.daemon = True
                            t.start()
                            cv2.putText(display_frame, "YAWN DETECTED!", (10, 60),
                                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)

                        cv2.putText(display_frame, f"EAR: {ear:.2f}", (RESOLUTION[0]-150, 30),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
                        cv2.putText(display_frame, f"YAWN: {lip_dist:.2f}", (RESOLUTION[0]-150, 60),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
                        cv2.putText(display_frame, f"Threshold: {ACTIVE_THRESHOLD:.2f}", (10, 90),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,0,0), 2)
                else:
                    # if was detected before, send alert, if not then dont
                    if face_detected_once and time.time() - last_face_detected >= 10 and not face_missing_alert_sent:
                        t = Thread(target=alarm_handler,
                                   args=("Warning: No face detected! Please pay attention!", "no face", 0))
                        t.daemon = True
                        t.start()
                        cv2.putText(display_frame, "WARNING: Face Not Detected!", (10, 120),
                                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
                        face_missing_alert_sent = True

                cv2.imshow("Driver Monitoring", display_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    exit_requested = True
                    break

            if exit_requested:
                break

        finally:
            vs.release()
            cv2.destroyAllWindows()
            engine.stop()
            firebase_watch.unsubscribe()

        # loop back to wait for new active user
        print("[INFO] Detection loop ended. Restarting process.")
        time.sleep(2)

if __name__ == "__main__":
    main()
