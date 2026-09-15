/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STUDIO_FIREBASE_API_KEY: string;
  readonly VITE_STUDIO_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_STUDIO_FIREBASE_PROJECT_ID: string;
  readonly VITE_STUDIO_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_STUDIO_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_STUDIO_FIREBASE_APP_ID: string;
  readonly VITE_STUDIO_FIRESTORE_DATABASE_ID?: string;
  readonly VITE_PORTAL_FIREBASE_API_KEY: string;
  readonly VITE_PORTAL_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_PORTAL_FIREBASE_PROJECT_ID: string;
  readonly VITE_PORTAL_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_PORTAL_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_PORTAL_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
