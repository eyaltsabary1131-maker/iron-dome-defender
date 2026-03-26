import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBRYIQZiBtLQqZbuFUqrP3MtORbv0_PIsA",
  authDomain: "irondome-f7d47.firebaseapp.com",
  projectId: "irondome-f7d47",
  storageBucket: "irondome-f7d47.firebasestorage.app",
  messagingSenderId: "702379726017",
  appId: "1:702379726017:web:6ca1c49cfad4b05a137040",
  measurementId: "G-53G0VM4T4D"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
