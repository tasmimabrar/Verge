import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // These will be implemented when Firebase is set up
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Replace with Firebase auth state listener when Firebase is set up
  useEffect(() => {
    // Simulate checking for existing session
    const checkAuth = async () => {
      // For now, check localStorage for mock auth state
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        setUser(JSON.parse(mockUser));
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Mock login function - will be replaced with Firebase auth
  const login = async (email: string, password: string) => {
    console.log('Login called with:', email, password);
    // TODO: Implement Firebase login
    const mockUser = {
      uid: 'mock-user-id',
      email,
      displayName: email.split('@')[0],
    };
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  // Mock signup function - will be replaced with Firebase auth
  const signup = async (email: string, password: string) => {
    console.log('Signup called with:', email, password);
    // TODO: Implement Firebase signup
    const mockUser = {
      uid: 'mock-user-id',
      email,
      displayName: email.split('@')[0],
    };
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  // Mock logout function - will be replaced with Firebase auth
  const logout = async () => {
    console.log('Logout called');
    // TODO: Implement Firebase logout
    localStorage.removeItem('mockUser');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export context for use in custom hook
export { AuthContext };
