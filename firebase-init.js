// Firebase init (ES module). Exposes simple helper functions on window for auth.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
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

window.firebaseAuthPersistence = 'local';

window.firebaseAuthReady = setPersistence(auth, browserLocalPersistence)
  .then(function() {
    return auth;
  })
  .catch(function(err) {
    console.error('[SpikeCoach Auth] setPersistence failed:', err && err.code ? err.code : err);
    return auth;
  });

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

window.sendUserEmailVerification = function(user) {
  var target = user || auth.currentUser;
  if (!target) {
    return Promise.reject(Object.assign(new Error('No signed-in user.'), { code: 'auth/no-current-user' }));
  }
  return sendEmailVerification(target);
};

window.reloadFirebaseUser = function() {
  var user = auth.currentUser;
  if (!user) {
    return Promise.reject(Object.assign(new Error('No signed-in user.'), { code: 'auth/no-current-user' }));
  }
  return reload(user).then(function() {
    return auth.currentUser;
  });
};

window.sendPasswordReset = function(email) {
  return sendPasswordResetEmail(auth, email);
};

window.updateUserDisplayName = function(user, displayName) {
  var target = user || auth.currentUser;
  if (!target) {
    return Promise.reject(Object.assign(new Error('No signed-in user.'), { code: 'auth/no-current-user' }));
  }
  return updateProfile(target, { displayName: displayName });
};

window.firebaseAuthReady.then(function() {
  onAuthStateChanged(auth, function(user) {
    if (typeof window.spikeCoachOnAuthStateChanged === 'function') {
      window.spikeCoachOnAuthStateChanged(user);
    }
  });
});
