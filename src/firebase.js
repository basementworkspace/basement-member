import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// La configurazione web Firebase è pubblica: la protezione dei dati è affidata
// alle regole Firestore (firestore.rules), mai a questo oggetto.
const firebaseConfig = {
  apiKey: 'AIzaSyCyu5aUnaOXeAVC7yWjb4meRJxFTg4f2mA',
  authDomain: 'basement-fa904.firebaseapp.com',
  projectId: 'basement-fa904',
  storageBucket: 'basement-fa904.firebasestorage.app',
  messagingSenderId: '787081574880',
  appId: '1:787081574880:web:89e90d9b326b63d7451385',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// `npm run dev:emu` usa gli emulatori locali invece del progetto reale.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// Deve coincidere con l'email in firestore.rules → isAdmin().
export const ADMIN_EMAIL = 'base.basement.workspace@gmail.com';
export const isAdminEmail = (user) => user?.email?.toLowerCase() === ADMIN_EMAIL;
// L'admin deve aver verificato l'email (le regole Firestore lo richiedono).
export const isAdminUser = (user) => isAdminEmail(user) && user.emailVerified === true;
