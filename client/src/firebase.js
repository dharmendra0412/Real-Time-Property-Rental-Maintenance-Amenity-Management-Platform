import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// User's configured Firebase project settings
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCYtrjVXeRRaWD7lFVEyn1IqSJbuSI370g",
  authDomain: "sjyline-enterprise.firebaseapp.com",
  projectId: "sjyline-enterprise",
  storageBucket: "sjyline-enterprise.firebasestorage.app",
  messagingSenderId: "44847642712",
  appId: "1:44847642712:web:495a4ec7db4aa6bff8322d",
  measurementId: "G-32GHS0F46J"
};

export const getFirebaseConfig = () => {
  let localSaved = {};
  try {
    localSaved = JSON.parse(localStorage.getItem('skyline_firebase_config') || '{}');
  } catch (e) {
    localSaved = {};
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localSaved.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localSaved.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localSaved.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localSaved.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localSaved.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || localSaved.appId || DEFAULT_FIREBASE_CONFIG.appId
  };
};

export const saveFirebaseConfig = (config) => {
  try {
    localStorage.setItem('skyline_firebase_config', JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
};

export const isFirebaseConfigured = () => {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId);
};

let app = null;
let auth = null;
let googleProvider = null;

export const initFirebase = () => {
  if (!isFirebaseConfigured()) return null;
  const cfg = getFirebaseConfig();
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(cfg);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return auth;
  } catch (err) {
    console.warn('[Firebase Init Warning]:', err.message);
    return null;
  }
};

// Initialize on module load
initFirebase();

/**
 * Trigger Firebase Google OAuth Popup
 * Returns user info and Firebase ID Token
 */
export const signInWithGoogleFirebase = async () => {
  if (!auth) {
    initFirebase();
  }

  if (!isFirebaseConfigured() || !auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return {
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL,
    uid: user.uid,
    idToken
  };
};

export { app, auth, googleProvider };
