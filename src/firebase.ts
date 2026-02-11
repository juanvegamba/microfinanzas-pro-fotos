import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// SECURITY WARNING: [OWASP-A07:2021] Identification and Authentication Failures
// The API Key is hardcoded. In production, this MUST be moved to environment variables 
// (e.g., import.meta.env.VITE_FIREBASE_API_KEY) and restricted in the Google Cloud Console.
export const firebaseConfig = {
  apiKey: "AIzaSyBSecQ1h5cIhPflkL9uW6twz_iv1zcVbcM",
  authDomain: "microfin-pro.firebaseapp.com",
  projectId: "microfin-pro",
  storageBucket: "microfin-pro.firebasestorage.app",
  messagingSenderId: "221965159882",
  appId: "1:221965159882:web:9bde109df6fdcdf3e61333",
  measurementId: "G-P0C40SMQNR"
};

// --- SOLUTION: SIMPLIFIED INITIALIZATION ---
// All complex and experimental settings have been removed.
// This reverts to the standard, battle-tested Firebase setup.

let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  throw new Error("Failed to initialize Firebase app.");
}

export const db: Firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);