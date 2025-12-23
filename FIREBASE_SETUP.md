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

## Step 4: Update Configuration

Open `frontend/src/firebase/config.js` and replace with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## That's it! 

Firebase handles all authentication on the cloud. No backend database needed! ✅

- Users register with email and password
- Firebase securely stores credentials
- Automatic session management
- Works across devices
