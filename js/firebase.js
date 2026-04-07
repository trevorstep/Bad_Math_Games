// c:\Users\trevo\OneDrive\Documents\Semester 6\wdd231_Web_Dev\Bad_Math_Games\js\firebase.js

// Import Firebase modules directly from CDN URLs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';

// Your web app's Firebase configuration
// IMPORTANT: Replace these placeholders with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBCA35lCN_JdOO5rwe91HvFmWuoWvx8DM",
  authDomain: "bad-math-games.firebaseapp.com",
  projectId: "bad-math-games",
  storageBucket: "bad-math-games.firebasestorage.app",
  messagingSenderId: "832354685660",
  appId: "1:832354685660:web:c5aa23fe7ec060810c5a19",
  measurementId: "G-0M09SQ1GDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get the Auth instance and re-export it along with authentication functions
export const auth = getAuth(app);
export { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile };