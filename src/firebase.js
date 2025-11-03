import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 把你剛複製的 firebaseConfig 貼在這裡
const firebaseConfig = {
  apiKey: "AIzaSyCE4nwb17BLJ4aDHZzKgFNjA7ADhXm60eg",
  authDomain: "healing-letter-app-test.firebaseapp.com",
  projectId: "healing-letter-app-test",
  storageBucket: "healing-letter-app-test.firebasestorage.app",
  messagingSenderId: "156685615191",
  appId: "1:156685615191:web:4e1da5872df17546846312"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);
export const db = getFirestore(app);
