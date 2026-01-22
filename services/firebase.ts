
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCeeqo_B4KkvVqScU2tUAmCOXKRdczsDmg",
  authDomain: "manifestation-e9c6f.firebaseapp.com",
  projectId: "manifestation-e9c6f",
  storageBucket: "manifestation-e9c6f.firebasestorage.app",
  messagingSenderId: "50846238672",
  appId: "1:50846238672:web:d600f5a13875c53720dbd5",
  measurementId: "G-T4RYXXC7W7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics (Safe check for SSR/Node environments)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics failed to initialize", e);
  }
}

export { auth, db, analytics };
