import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { toast } from 'sonner';
import { config } from '@/lib/config';

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
  const [user, setUser] = useState<UserProfile | null>(config.auth.useMockAuth ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!config.auth.useMockAuth);

  useEffect(() => {
    if (config.auth.useMockAuth) {
      // Development mode with mock user
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Production mode with real Supabase authentication
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      // Try to get existing profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_seen: profile.last_seen,
        });
      } else {
        // Create new profile if it doesn't exist
        const newProfileData = {
          user_id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'viewer' as const, // Default role
          last_seen: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfileData])
          .select()
          .single();

        if (createError) throw createError;
        
        if (createdProfile) {
          setUser({
            id: createdProfile.id,
            email: createdProfile.email,
            name: createdProfile.name,
            role: createdProfile.role,
            created_at: createdProfile.created_at,
            updated_at: createdProfile.updated_at,
            last_seen: createdProfile.last_seen,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Erro ao carregar perfil do utilizador');
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    if (config.auth.useMockAuth) {
      toast.success('Login realizado com sucesso (modo desenvolvimento)');
      setUser(MOCK_USER);
      return true;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user);
        toast.success('Login realizado com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Erro no login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'viewer'): Promise<boolean> => {
    if (config.auth.useMockAuth) {
      toast.success('Conta criada com sucesso (modo desenvolvimento)');
      return true;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        toast.success('Conta criada com sucesso. Verifique o seu email.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Erro ao criar conta');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (config.auth.useMockAuth) {
      toast.success('Logout realizado com sucesso (modo desenvolvimento)');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setUser(null);
      setSession(null);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro no logout');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    if (config.auth.useMockAuth) {
      setUser(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Perfil atualizado com sucesso (modo desenvolvimento)');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setUser(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const resetPassword = async (email: string) => {
    if (config.auth.useMockAuth) {
      toast.success('Email de reset enviado (modo desenvolvimento)');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Email de reset enviado com sucesso');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao enviar email de reset');
    }
  };

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS.admin): boolean => {
    if (config.auth.useMockAuth) {
      return true;
    }

    if (!user) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions[permission] || false;
  };

  const getActiveUsers = async (): Promise<UserProfile[]> => {
    if (config.auth.useMockAuth) {
      return [MOCK_USER];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return (data || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_seen: profile.last_seen,
      }));
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: config.auth.useMockAuth ? true : !!user,
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
