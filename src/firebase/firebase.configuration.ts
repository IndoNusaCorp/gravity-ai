// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Aktifkan App Check debug mode saat development
// Ini akan menghasilkan debug token di browser console yang harus didaftarkan di Firebase Console
if (typeof window !== "undefined") {
  if (process.env.NODE_ENV !== "production") {
    // @ts-ignore - self.FIREBASE_APPCHECK_DEBUG_TOKEN is a Firebase-specific global
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // Initialize App Check
  // PENTING: Ganti 'YOUR_RECAPTCHA_V3_SITE_KEY' dengan site key dari Google reCAPTCHA v3 Console
  // Atau jika tidak pakai reCAPTCHA, bisa pakai debug provider saja untuk development
  try {
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
    if (recaptchaSiteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else if (process.env.NODE_ENV !== "production") {
      // Saat development tanpa reCAPTCHA key, gunakan debug provider
      console.warn("[App Check] No reCAPTCHA site key found. Debug mode enabled - check console for debug token.");
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider("placeholder-key"),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (error) {
    console.error("[App Check] Failed to initialize:", error);
  }
}

// export const storage = getStorage(app);
export const Authentication = getAuth(app);
export const signinwithgoogle = new GoogleAuthProvider();
export const signinwithpopup = () => signInWithPopup(Authentication, signinwithgoogle);

let analytics: any;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };
