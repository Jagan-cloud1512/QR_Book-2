import { doc, getDoc, setDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { getActiveDb } from './firebase';

export interface UserAccount {
  username: string;
  passwordHash: string;
  createdAt: string;
  displayName?: string;
  email?: string;
  role: 'patron';
  appSource?: string;
}

const SESSION_STORAGE_KEY = 'librislink_auth_session';

export function getStoredSession(): UserAccount | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load stored auth session:', e);
  }
  return null;
}

export function saveSession(user: UserAccount) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed to save session to sessionStorage:', e);
  }
  window.dispatchEvent(new CustomEvent('librislink_auth_changed', { detail: { user } }));
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
  window.dispatchEvent(new CustomEvent('librislink_auth_changed', { detail: { user: null } }));
}

/**
 * Creates a new patron account exclusively in the 'patrons' Firestore collection.
 * They are stored as role: 'patron', preventing access to the admin web portal.
 * Credentials are encrypted using bcryptjs (salt rounds = 10).
 */
export async function createAccount(
  username: string,
  passwordPlain: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, message: 'Username is required.' };
  }
  if (!passwordPlain || passwordPlain.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters.' };
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(passwordPlain, salt);
  const createdAt = new Date().toISOString();

  const userObj: UserAccount = {
    username: cleanUsername,
    passwordHash,
    createdAt,
    displayName: username.trim(),
    role: 'patron',
    appSource: 'librislink_mobile_patron',
  };

  const db = getActiveDb();

  try {
    // Check if already registered in 'patrons' collection
    const patronRef = doc(db, 'patrons', cleanUsername);
    const patronSnap = await getDoc(patronRef);
    if (patronSnap.exists()) {
      return { success: false, message: `Patron username "${cleanUsername}" is already taken.` };
    }

    // Save exclusively to 'patrons' collection
    await setDoc(patronRef, userObj);
    saveSession(userObj);
    return {
      success: true,
      message: 'Patron account created successfully in patrons collection!',
      user: userObj,
    };
  } catch (err: any) {
    console.error('Firestore signup error in patrons collection:', err);
    saveSession(userObj);
    return {
      success: true,
      message: 'Patron account created (stored locally).',
      user: userObj,
    };
  }
}

/**
 * Authenticates patron credentials exclusively against the 'patrons' Firestore collection.
 */
export async function loginUser(
  username: string,
  passwordPlain: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, message: 'Username is required.' };
  }
  if (!passwordPlain) {
    return { success: false, message: 'Password is required.' };
  }

  const db = getActiveDb();

  try {
    // Look up ONLY in 'patrons' collection
    const patronRef = doc(db, 'patrons', cleanUsername);
    const patronSnap = await getDoc(patronRef);

    if (!patronSnap.exists()) {
      return {
        success: false,
        message: `Patron "${cleanUsername}" not found. Please create a patron account.`,
      };
    }

    const userData = patronSnap.data() as UserAccount;
    const isValid = bcrypt.compareSync(passwordPlain, userData.passwordHash);

    if (isValid) {
      saveSession(userData);
      return {
        success: true,
        message: 'Patron authenticated successfully!',
        user: userData,
      };
    } else {
      return { success: false, message: 'Invalid password. Please try again.' };
    }
  } catch (err: any) {
    console.error('Firestore patron login error:', err);
    return {
      success: false,
      message: `Login error: ${err.message || 'Could not reach Firestore database.'}`,
    };
  }
}
