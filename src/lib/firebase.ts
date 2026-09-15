import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Web Portal external project config from user
export const PORTAL_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBDqLCWXZvpEVvvUR3tvzvJ7yoJX8IGY4k",
  authDomain: "qr-book-e34d4.firebaseapp.com",
  projectId: "qr-book-e34d4",
  storageBucket: "qr-book-e34d4.firebasestorage.app",
  messagingSenderId: "917075602202",
  appId: "1:917075602202:web:510380eb9085af9aaadaa3"
};

// Studio environment config
const studioFirebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Studio App ([DEFAULT])
export const studioApp: FirebaseApp = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(studioFirebaseConfig);

// Initialize Web Portal App (qr-book-e34d4)
export const portalApp: FirebaseApp = getApps().find((a) => a.name === 'qr-book-portal') || initializeApp(PORTAL_FIREBASE_CONFIG, 'qr-book-portal');

// Web Portal Firestore DB (qr-book-e34d4)
export const portalDb: Firestore = getFirestore(portalApp);

// Studio Named database (ai-studio-...)
export const namedDb: Firestore | null = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(studioApp, firebaseConfigData.firestoreDatabaseId)
  : null;

// Studio Default standard database (default)
export const defaultDb: Firestore = getFirestore(studioApp);

export type DbTargetType = 'portal' | 'named' | 'default';

// Active DB getter (default to 'portal' because user's web portal writes to qr-book-e34d4)
let currentDatabaseTarget: DbTargetType =
  (localStorage.getItem('shelf_db_target') as DbTargetType) || 'portal';

export function getActiveDb(): Firestore {
  if (currentDatabaseTarget === 'portal') {
    return portalDb;
  }
  if (currentDatabaseTarget === 'named' && namedDb) {
    return namedDb;
  }
  return defaultDb;
}

export function setDatabaseTarget(target: DbTargetType) {
  currentDatabaseTarget = target;
  localStorage.setItem('shelf_db_target', target);
}

export function getDatabaseTarget(): DbTargetType {
  return currentDatabaseTarget;
}

export const namedDatabaseId = firebaseConfigData.firestoreDatabaseId || '';

export const db: Firestore = getActiveDb();

export const auth: Auth = getAuth(studioApp);

// Initialize anonymous authentication
export async function initAuth(): Promise<string> {
  try {
    if (auth.currentUser) {
      return auth.currentUser.uid;
    }
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  } catch (err) {
    let fallbackUid = localStorage.getItem('shelf_patron_uid');
    if (!fallbackUid) {
      fallbackUid = `patron_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('shelf_patron_uid', fallbackUid);
    }
    return fallbackUid;
  }
}
