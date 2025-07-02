import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  requestPasswordReset: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = 'EPW#2006';
const RESET_EMAIL = 'info@epw.pt';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('isAuth') === 'true'
  );

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuth');
  };

  const requestPasswordReset = (email: string) => {
    if (email === RESET_EMAIL) {
      alert(`Email de reset enviado para ${RESET_EMAIL}. O link será válido por 24 horas.`);
    } else {
      alert('Email não autorizado para reset de password.');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};