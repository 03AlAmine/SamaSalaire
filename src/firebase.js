// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBctTjsOKdhBjCTgd-0-uv6mPD_xJylZdE",
  authDomain: "samasalaire.firebaseapp.com",
  projectId: "samasalaire",
  storageBucket: "samasalaire.firebasestorage.app",
  messagingSenderId: "1076884780088",
  appId: "1:1076884780088:web:277b10a9627f37105de2cd",
  measurementId: "G-2MX7E45SN5"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);


// ✅ Exportation
export { db, auth, storage, firebaseConfig };
