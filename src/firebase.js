import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBPCvv4m-ZNLEz0Y_s0u9QleQimUCS_CUY",
  authDomain: "incentive-vault-2.firebaseapp.com",
  projectId: "incentive-vault-2",
  storageBucket: "incentive-vault-2.firebasestorage.app",
  messagingSenderId: "462037126432",
  appId: "1:462037126432:web:dc4f244a246986e499b45",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;