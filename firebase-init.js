// Firebase init (ES module). Exposes simple helper functions on window for auth.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUTnFrlTu29speoOHncbrRGIKo5fpq5l4",
  authDomain: "spikecoach-b7a67.firebaseapp.com",
  projectId: "spikecoach-b7a67",
  storageBucket: "spikecoach-b7a67.firebasestorage.app",
  messagingSenderId: "136756983127",
  appId: "1:136756983127:web:b1abc6698032a6be6ffa12",
  measurementId: "G-PD1HGS5M8H"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { /* analytics may fail in some hosts */ }

const auth = getAuth(app);

// Simple wrappers attached to window for the app to call.
window.firebaseAuth = auth;

window.createUser = function(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
};

window.signInUser = function(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
};

window.signOutUser = function() {
  return signOut(auth);
};

window.onAuthStateChanged = function(cb) {
  return onAuthStateChanged(auth, cb);
};
