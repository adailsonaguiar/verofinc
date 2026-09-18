import { signInWithPopup, signOut } from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from '../firebase';

export async function signInWithGoogle(): Promise<string> {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await signOut(auth);
  } catch {
    // Ignora falhas de sign-out (ex.: app ainda não inicializado)
  }
}
