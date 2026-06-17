import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDaJG2yeSsqOoDDeCd1j3sqt6lmqvNBMX0",
  authDomain: "playbookstudio-d2f54.firebaseapp.com",
  projectId: "playbookstudio-d2f54",
  storageBucket: "playbookstudio-d2f54.firebasestorage.app",
  messagingSenderId: "752260820002",
  appId: "1:752260820002:web:45c421ed33b03104192e7b",
  measurementId: "G-0T71R4LHXT"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Validate Connection to Firestore as per critical constraint
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Firestore connected successfully");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Please check your Firebase configuration or network status.", error);
    } else {
      console.log("Firebase connection initialized (non-blocking test).", error);
    }
  }
}
testConnection();
