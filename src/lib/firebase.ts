import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// =============================================
// Firebase 설정을 아래에 입력하세요.
// Firebase Console → 프로젝트 설정 → 앱 → firebaseConfig 복사
// =============================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
