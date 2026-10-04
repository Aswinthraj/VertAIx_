// Firebase configuration with safe initialization fallback
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'vertaix-demo.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'vertaix-demo',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'vertaix-demo.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:123456789012:web:demoappvertaix',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = Boolean(
  process.env.REACT_APP_FIREBASE_API_KEY &&
  process.env.REACT_APP_FIREBASE_API_KEY !== 'YOUR_API_KEY' &&
  process.env.REACT_APP_FIREBASE_API_KEY.trim() !== ''
);

let app = null;
let auth = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} catch (error) {
  console.warn('[VertAIx] Firebase initialization fallback mode active:', error?.message);
}

export { auth };
export default app;
