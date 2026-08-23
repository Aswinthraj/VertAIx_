# Firebase Authentication Setup

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name your project (e.g., "VertAIx")
4. Follow the setup wizard

## Step 2: Enable Email/Password Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" provider
3. Click "Save"

## Step 3: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`)
4. Register your app (name it "VertAIx Web")
5. Copy the `firebaseConfig` object

## Step 4: Add Frontend Environment Variables

Create `frontend/.env.local` and add:

```bash
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

## That's it! 

Firebase handles all authentication on the cloud. No backend database needed! ✅

- Users register with email and password
- Firebase securely stores credentials
- Automatic session management
- Works across devices
