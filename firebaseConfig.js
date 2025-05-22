import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQAz7bXV3sBqEVO7lUQGQG5RZPtLlxKGE",
  authDomain: "smart-52763.firebaseapp.com",
  databaseURL: "https://smart-52763-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smart-52763",
  storageBucket: "smart-52763.appspot.com",
  messagingSenderId: "473502394913",
  appId: "1:473502394913:web:bc8468578a3ef1e1ea5160"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;

try {
  auth = getAuth(app); // Récupère si déjà initialisé
} catch (err) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(app);

export { auth, db };
