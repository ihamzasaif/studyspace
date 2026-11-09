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
  return `${clean}@studyroom.local`;
}

/**
 * Register a new user with username and password
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

  const email = `${cleanUser}@studyroom.local`;

  // 1. Create Firebase Auth user
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

  return {
    uid: user.uid,
    username: cleanUser,
    displayName: params.name.trim(),
    email: user.email || email,
    profession: profileData.profession,
    institution: profileData.institution,
    avatarColor: profileData.avatarColor,
    isAnonymous: false,
  };
}

/**
 * Login existing user with username or email
 */
export async function loginWithUsername(usernameOrEmail: string, password: string): Promise<AppAccount> {
  if (!usernameOrEmail.trim() || !password) {
    throw new Error('Please enter both username and password.');
  }

  const email = usernameToEmail(usernameOrEmail);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  return await fetchAppAccount(user);
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
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuth(callback: (account: AppAccount | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const acc = await fetchAppAccount(firebaseUser);
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
      callback(null);
    }
  });
}
