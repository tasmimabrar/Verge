// Export Firebase services
export { app, auth, db } from './config';

// Export auth functions
export {
  signupWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  onAuthStateChange,
} from './auth';

// Export Firestore functions
export {
  getUserSettings,
  updateUserSettings,
} from './firestore';
