import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// These will be pulled from your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth, db, storage;

// Guard: only initialize Firebase if the API key is present.
// Without this check, initializeApp() succeeds with undefined values but
// onAuthStateChanged() will hang forever, causing a permanent blank screen.
if (import.meta.env.VITE_FIREBASE_API_KEY) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch {
    console.warn(
      "Firebase not properly initialized. Make sure your .env variables are set.",
    );
  }
} else {
  console.warn(
    "Firebase env vars not found (.env.local). Running without auth.",
  );
}

export { app, auth, db, storage };
