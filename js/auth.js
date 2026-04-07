// auth.js
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "./firebase.js";

export async function signUp(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (username) {
    await updateProfile(userCredential.user, { displayName: username });
  }
  return userCredential.user;
}

export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logOut() {
  await signOut(auth);
}
