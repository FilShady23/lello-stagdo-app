// firebase.js — Inizializzazione Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBw2oKdT3Jn9u_CpRZDkKxw5KqflPI7b4",
  authDomain: "lello-stag-do.firebaseapp.com",
  projectId: "lello-stag-do",
  storageBucket: "lello-stag-do.firebasestorage.app",
  messagingSenderId: "776787149508",
  appId: "1:776787149508:web:afe3d2b06870a0e7ed3f91"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esporta tutto quello che serve agli altri moduli
export {
  db,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment
};
