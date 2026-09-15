import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5iGbi8e9EgMIXv9vzAgTnyzuiQvarkkw",
  authDomain: "incentive-vault.firebaseapp.com",
  projectId: "incentive-vault",
  storageBucket: "incentive-vault.firebasestorage.app",
  messagingSenderId: "186640064022",
  appId: "1:186640064022:web:338b48890c93747d049f37",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
