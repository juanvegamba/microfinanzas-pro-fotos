
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// SECURITY WARNING: [OWASP-A07:2021] Identification and Authentication Failures
// Ideally, use environment variables: import.meta.env.VITE_FIREBASE_API_KEY
export const firebaseConfig = {
  apiKey: "AIzaSyBSecQ1h5cIhPflkL9uW6twz_iv1zcVbcM",
  authDomain: "microfin-pro.firebaseapp.com",
  projectId: "microfin-pro",
  storageBucket: "microfin-pro.firebasestorage.app",
  messagingSenderId: "221965159882",
  appId: "1:221965159882:web:9bde109df6fdcdf3e61333",
  measurementId: "G-P0C40SMQNR"
};

let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  throw new Error("Failed to initialize Firebase app.");
}

export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
