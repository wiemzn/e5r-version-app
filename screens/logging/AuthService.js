import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const AuthService = {
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.log('Sign in error:', error);
      return null;
    }
  },

  register: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.log('Registration error:', error);
      return null;
    }
  },

  signOut: async () => {
    await signOut(auth);
  },

  getUser: () => new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  }),

  authStateChanges: (callback) => onAuthStateChanged(auth, callback),
};

export default AuthService;