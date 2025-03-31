import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence, getAuth, GoogleAuthProvider } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBl38Ci-__sUi4KcUHxzSL9O0t4cNl58mI",
  authDomain: "vassist-c02a7.firebaseapp.com",
  projectId: "vassist-c02a7",
  storageBucket: "vassist-c02a7.firebasestorage.app",
  messagingSenderId: "907754632940",
  appId: "1:907754632940:web:c8d3c27b5e1f7d5d9fd7c9"
};

const app = initializeApp(firebaseConfig);

// Enable auth persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };