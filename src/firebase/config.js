import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Replace with your Firebase project config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBRWuV1gbJwQtQtMRNQ08PG6MPg_-CRjGo",
  authDomain: "monopoly-535fb.firebaseapp.com",
  projectId: "monopoly-535fb",
  storageBucket: "monopoly-535fb.firebasestorage.app",
  messagingSenderId: "1093725683460",
  appId: "1:1093725683460:web:87924229fccf9b5c775a51"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function signInUser() {
  const result = await signInAnonymously(auth);
  return result.user;
}
