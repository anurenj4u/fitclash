import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLrgRr0iu9HrcwbRdIrdAoXxfZfzsfs8Y",
  authDomain: "fitclash-27e15.firebaseapp.com",
  projectId: "fitclash-27e15",
  storageBucket: "fitclash-27e15.firebasestorage.app",
  messagingSenderId: "481872299396",
  appId: "1:481872299396:web:87d98defde222960c249d1",
  measurementId: "G-93BMR8ESBX"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics (only on client side)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
  });
}

export { app, auth, db, analytics };

