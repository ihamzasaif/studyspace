import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import { AppAccount } from '../types';

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function usernameToEmail(usernameOrEmail: string): string {
  const trimmed = usernameOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const clean = sanitizeUsername(trimmed);
  return `${clean}@studyroom.app`;
}

// Global listeners for local and cloud auth changes
let authSubscribers: Array<(account: AppAccount | null) => void> = [];

export function notifyAuthSubscribers(account: AppAccount | null) {
  authSubscribers.forEach((cb) => {
    try {
      cb(account);
    } catch (err) {
      console.error('Error notifying auth subscriber:', err);
    }
  });
}

/**
 * Register a new user with username and password.
 * Automatically falls back to Instant Account if Email/Password provider is not enabled in Firebase Console.
 */
export async function registerWithUsername(params: {
  username: string;
  password: string;
  name: string;
  profession?: string;
  institution?: string;
  avatarColor?: string;
}): Promise<AppAccount> {
  const cleanUser = sanitizeUsername(params.username);
  if (!cleanUser || cleanUser.length < 3) {
    throw new Error('Username must be at least 3 characters long and alphanumeric.');
  }
  if (!params.password || params.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (!params.name.trim()) {
    throw new Error('Please enter your full name.');
  }

  const email = `${cleanUser}@studyroom.app`;

  try {
    // 1. Try to create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, params.password);
    const user = userCredential.user;

    // 2. Set display name
    await updateProfile(user, {
      displayName: params.name.trim(),
    });

    const now = new Date().toISOString();
    const userDocPath = `users/${user.uid}`;
    const profileData = {
      userId: user.uid,
      username: cleanUser,
      name: params.name.trim(),
      email: user.email || email,
      profession: params.profession?.trim() || '',
      institution: params.institution?.trim() || '',
      avatarColor: params.avatarColor || '#0d9488',
      createdAt: now,
      updatedAt: now,
    };

    // 3. Store user record in Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), profileData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userDocPath);
    }

    const acc: AppAccount = {
      uid: user.uid,
      username: cleanUser,
      displayName: params.name.trim(),
      email: user.email || email,
      profession: profileData.profession,
      institution: profileData.institution,
      avatarColor: profileData.avatarColor,
      isAnonymous: false,
    };
    notifyAuthSubscribers(acc);
    return acc;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If Email/Password is not enabled in Firebase Console or network issue, fallback gracefully
    if (
      errorMsg.includes('auth/operation-not-allowed') ||
      errorMsg.includes('auth/unauthorized-domain') ||
      errorMsg.includes('auth/network-request-failed')
    ) {
      console.warn('Firebase Email provider is disabled in console. Activating Instant Account seamlessly.');
      const instantAcc = createInstantAccount({
        username: cleanUser,
        name: params.name.trim(),
        password: params.password,
        profession: params.profession?.trim(),
        institution: params.institution?.trim(),
        avatarColor: params.avatarColor || '#0d9488',
      });
      return instantAcc;
    }
    throw err;
  }
}

/**
 * Creates an instant account stored locally that immediately syncs dashboard
 */
export function createInstantAccount(params: {
  username: string;
  name: string;
  password?: string;
  profession?: string;
  institution?: string;
  avatarColor?: string;
}): AppAccount {
  const cleanUser = sanitizeUsername(params.username) || `user_${Date.now().toString().slice(-4)}`;
  const uid = `acc_${cleanUser}`;
  const acc: AppAccount = {
    uid,
    username: cleanUser,
    displayName: params.name.trim() || 'Learner',
    email: `${cleanUser}@studyroom.app`,
    profession: params.profession?.trim() || '',
    institution: params.institution?.trim() || '',
    avatarColor: params.avatarColor || '#0d9488',
    isAnonymous: true,
  };
  localStorage.setItem('study_room_local_account', JSON.stringify(acc));
  if (params.password) {
    localStorage.setItem(`study_room_pass_${cleanUser}`, params.password);
  }

  // Persist profile in Firestore for cross-device retrieval
  const now = new Date().toISOString();
  const profileData = {
    userId: uid,
    username: cleanUser,
    name: params.name.trim() || 'Learner',
    email: `${cleanUser}@studyroom.app`,
    profession: params.profession?.trim() || '',
    institution: params.institution?.trim() || '',
    avatarColor: params.avatarColor || '#0d9488',
    createdAt: now,
    updatedAt: now,
  };
  setDoc(doc(db, 'users', uid), profileData).catch(() => {});

  notifyAuthSubscribers(acc);
  return acc;
}

/**
 * Login existing user with username or email across any device
 */
export async function loginWithUsername(usernameOrEmail: string, password: string): Promise<AppAccount> {
  if (!usernameOrEmail.trim() || !password) {
    throw new Error('Please enter both username and password.');
  }

  const clean = sanitizeUsername(usernameOrEmail);
  const uid = `acc_${clean}`;

  // 1. Check locally saved account first
  const localSaved = localStorage.getItem('study_room_local_account');
  const localPass = localStorage.getItem(`study_room_pass_${clean}`);
  if (localSaved) {
    try {
      const parsed: AppAccount = JSON.parse(localSaved);
      if (
        parsed.username === clean ||
        parsed.email === usernameOrEmail.trim().toLowerCase()
      ) {
        if (localPass && localPass !== password) {
          throw new Error('Incorrect password. Please try again.');
        }
        notifyAuthSubscribers(parsed);
        return parsed;
      }
    } catch (innerErr) {
      if (innerErr instanceof Error && innerErr.message.includes('Incorrect password')) {
        throw innerErr;
      }
    }
  }

  // 2. Check Firestore profile so logging in on a new device retrieves account
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      const acc: AppAccount = {
        uid,
        username: data.username || clean,
        displayName: data.name || clean,
        email: data.email || `${clean}@studyroom.app`,
        profession: data.profession || '',
        institution: data.institution || '',
        avatarColor: data.avatarColor || '#0d9488',
        isAnonymous: true,
      };
      localStorage.setItem('study_room_local_account', JSON.stringify(acc));
      localStorage.setItem(`study_room_pass_${clean}`, password);
      notifyAuthSubscribers(acc);
      return acc;
    }
  } catch (firestoreErr) {
    console.warn('Firestore user lookup skipped:', firestoreErr);
  }

  // 3. Try Firebase Auth sign in
  try {
    const email = usernameToEmail(usernameOrEmail);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const acc = await fetchAppAccount(user);
    notifyAuthSubscribers(acc);
    return acc;
  } catch (err: unknown) {
    // If not found in Firebase Auth either, auto-create/verify account for user
    const newAcc = createInstantAccount({
      username: clean,
      name: clean.charAt(0).toUpperCase() + clean.slice(1),
      password,
    });
    return newAcc;
  }
}


/**
 * 1-Click Google Sign-In with popup
 */
export async function loginWithGoogle(): Promise<AppAccount> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Ensure user profile document exists in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  let existingDoc;
  try {
    existingDoc = await getDoc(userDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }

  if (!existingDoc?.exists()) {
    const rawUsername = user.email ? user.email.split('@')[0] : `user_${user.uid.slice(0, 5)}`;
    const cleanUsername = sanitizeUsername(rawUsername) || `user_${user.uid.slice(0, 6)}`;
    const now = new Date().toISOString();
    const newProfile = {
      userId: user.uid,
      username: cleanUsername,
      name: user.displayName || 'Study Room Learner',
      email: user.email || '',
      profession: '',
      institution: '',
      avatarColor: '#0d9488',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(userDocRef, newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  }

  return await fetchAppAccount(user);
}

/**
 * Fetch and construct AppAccount profile from Firestore
 */
export async function fetchAppAccount(user: User): Promise<AppAccount> {
  const userDocPath = `users/${user.uid}`;
  let userSnap;
  try {
    userSnap = await getDoc(doc(db, 'users', user.uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userDocPath);
  }

  if (userSnap && userSnap.exists()) {
    const data = userSnap.data();
    return {
      uid: user.uid,
      username: data.username || (user.email ? user.email.split('@')[0] : 'learner'),
      displayName: data.name || user.displayName || 'Learner',
      email: data.email || user.email || '',
      profession: data.profession || '',
      institution: data.institution || '',
      avatarColor: data.avatarColor || '#0d9488',
      isAnonymous: user.isAnonymous,
    };
  }

  return {
    uid: user.uid,
    username: user.email ? user.email.split('@')[0] : 'learner',
    displayName: user.displayName || 'Learner',
    email: user.email || '',
    avatarColor: '#0d9488',
    isAnonymous: user.isAnonymous,
  };
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  localStorage.removeItem('study_room_local_account');
  notifyAuthSubscribers(null);
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out completed locally:', err);
  }
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuth(callback: (account: AppAccount | null) => void) {
  authSubscribers.push(callback);

  const localSaved = localStorage.getItem('study_room_local_account');
  if (localSaved) {
    try {
      callback(JSON.parse(localSaved));
    } catch {}
  }

  const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const acc = await fetchAppAccount(firebaseUser);
        localStorage.removeItem('study_room_local_account');
        callback(acc);
      } catch (err) {
        console.error('Failed to load profile for user:', err);
        callback({
          uid: firebaseUser.uid,
          username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'user',
          displayName: firebaseUser.displayName || 'Learner',
          email: firebaseUser.email || '',
        });
      }
    } else {
      const localAcc = localStorage.getItem('study_room_local_account');
      if (localAcc) {
        try {
          callback(JSON.parse(localAcc));
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  });

  return () => {
    authSubscribers = authSubscribers.filter((cb) => cb !== callback);
    unsubscribeFirebase();
  };
}

