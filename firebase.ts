
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Singleton pattern for App initialization to prevent multiple instances
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  throw new Error("Failed to initialize Firebase app.");
}

// Initialize Firestore with offline persistence enabled
// QA CHECK: specific persistence settings optimized for unstable connections
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Re-export Auth with explicit type safety context if needed in future
export const auth = getAuth(app);
