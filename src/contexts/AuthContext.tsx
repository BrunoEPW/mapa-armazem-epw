import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (permission: keyof typeof ROLE_PERMISSIONS.admin) => boolean;
  getActiveUsers: () => Promise<UserProfile[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development mode
const MOCK_USER: UserProfile = {
  id: 'mock-user-id',
  email: 'dev@test.com',
  name: 'Utilizador de Desenvolvimento',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_seen: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // For development mode, use mock user instead of real authentication
  const [user, setUser] = useState<UserProfile | null>(MOCK_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // Set to false for immediate access

  // Temporarily disable real authentication
  useEffect(() => {
    // Mock immediate authentication
    setUser(MOCK_USER);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Mock sign in
    toast.success('Login realizado com sucesso (modo desenvolvimento)');
    setUser(MOCK_USER);
    return true;
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'viewer'): Promise<boolean> => {
    // Mock sign up
    toast.success('Conta criada com sucesso (modo desenvolvimento)');
    return true;
  };

  const signOut = async () => {
    // Mock sign out
    toast.success('Logout realizado com sucesso (modo desenvolvimento)');
    // Keep user logged in for development
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, ...updates } : null);
    toast.success('Perfil atualizado com sucesso (modo desenvolvimento)');
  };

  const resetPassword = async (email: string) => {
    toast.success('Email de reset enviado (modo desenvolvimento)');
  };

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS.admin): boolean => {
    // In development mode, always return true for admin permissions
    return true;
  };

  const getActiveUsers = async (): Promise<UserProfile[]> => {
    // Return mock users
    return [MOCK_USER];
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: true, // Always authenticated in development mode
      signIn,
      signUp,
      signOut,
      updateProfile,
      resetPassword,
      hasPermission,
      getActiveUsers,
    }}>
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
