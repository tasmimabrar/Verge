import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import {
  signupWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout as firebaseLogout,
  onAuthStateChange,
} from '@/lib/firebase';
import { generateAllNotifications } from '@/shared/services/notificationService';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        setUser(userData);
        
        // Generate notifications for the user
        generateAllNotifications(firebaseUser.uid).catch(err => {
          console.error('Failed to generate notifications:', err);
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      await loginWithEmail(email, password);
      // User state will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signup = async (email: string, password: string) => {
    try {
      await signupWithEmail(email, password);
      // User state will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login with Google
  const handleLoginWithGoogle = async () => {
    try {
      await loginWithGoogle();
      // User state will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseLogout();
      // User state will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithGoogle: handleLoginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export context for use in custom hook
export { AuthContext };
