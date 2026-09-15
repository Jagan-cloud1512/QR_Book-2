import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, signInAnonymously } from "firebase/auth";

function requiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }
  return value;
}

const studioFirebaseConfig = {
  apiKey: requiredFirebaseEnv("VITE_STUDIO_FIREBASE_API_KEY"),
  authDomain: requiredFirebaseEnv("VITE_STUDIO_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredFirebaseEnv("VITE_STUDIO_FIREBASE_PROJECT_ID"),
  storageBucket: requiredFirebaseEnv("VITE_STUDIO_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredFirebaseEnv(
    "VITE_STUDIO_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: requiredFirebaseEnv("VITE_STUDIO_FIREBASE_APP_ID"),
};

const portalFirebaseConfig = {
  apiKey: requiredFirebaseEnv("VITE_PORTAL_FIREBASE_API_KEY"),
  authDomain: requiredFirebaseEnv("VITE_PORTAL_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredFirebaseEnv("VITE_PORTAL_FIREBASE_PROJECT_ID"),
  storageBucket: requiredFirebaseEnv("VITE_PORTAL_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredFirebaseEnv(
    "VITE_PORTAL_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: requiredFirebaseEnv("VITE_PORTAL_FIREBASE_APP_ID"),
};

// Initialize Studio App ([DEFAULT])
export const studioApp: FirebaseApp =
  getApps().find((a) => a.name === "[DEFAULT]") ||
  initializeApp(studioFirebaseConfig);

// Initialize Web Portal App (qr-book-e34d4)
export const portalApp: FirebaseApp =
  getApps().find((a) => a.name === "qr-book-portal") ||
  initializeApp(portalFirebaseConfig, "qr-book-portal");

// Web Portal Firestore DB (qr-book-e34d4)
export const portalDb: Firestore = getFirestore(portalApp);

// Studio Named database (ai-studio-...)
export const namedDb: Firestore | null = import.meta.env
  .VITE_STUDIO_FIRESTORE_DATABASE_ID
  ? getFirestore(studioApp, import.meta.env.VITE_STUDIO_FIRESTORE_DATABASE_ID)
  : null;

// Studio Default standard database (default)
export const defaultDb: Firestore = getFirestore(studioApp);

export type DbTargetType = "portal" | "named" | "default";

// Active DB getter (default to 'portal' because user's web portal writes to qr-book-e34d4)
let currentDatabaseTarget: DbTargetType =
  (localStorage.getItem("shelf_db_target") as DbTargetType) || "portal";

export function getActiveDb(): Firestore {
  if (currentDatabaseTarget === "portal") {
    return portalDb;
  }
  if (currentDatabaseTarget === "named" && namedDb) {
    return namedDb;
  }
  return defaultDb;
}

export function setDatabaseTarget(target: DbTargetType) {
  currentDatabaseTarget = target;
  localStorage.setItem("shelf_db_target", target);
}

export function getDatabaseTarget(): DbTargetType {
  return currentDatabaseTarget;
}

export const namedDatabaseId =
  import.meta.env.VITE_STUDIO_FIRESTORE_DATABASE_ID || "";

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
    let fallbackUid = localStorage.getItem("shelf_patron_uid");
    if (!fallbackUid) {
      fallbackUid = `patron_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("shelf_patron_uid", fallbackUid);
    }
    return fallbackUid;
  }
}
