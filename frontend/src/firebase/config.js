// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCln0yN44x8Zw44wrBygs94vUVGlljYDE",
  authDomain: "vertaix-42d88.firebaseapp.com",
  projectId: "vertaix-42d88",
  storageBucket: "vertaix-42d88.firebasestorage.app",
  messagingSenderId: "687116752364",
  appId: "1:687116752364:web:e1fa6a1da8d901a8b31cc9",
  measurementId: "G-JTM3GH421L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
