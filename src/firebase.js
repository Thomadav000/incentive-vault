import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAbXHqRRl-HIZezcCXr6WIqs_toCxKWZ_c",
  authDomain: "incentive-vault-final.firebaseapp.com",
  projectId: "incentive-vault-final",
  storageBucket: "incentive-vault-final.firebasestorage.app",
  messagingSenderId: "378781635243",
  appId: "1:378781635243:web:f73b7b8c7931149f2dddee",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;