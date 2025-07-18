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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Defer profile loading to avoid auth state deadlock
          setTimeout(() => {
            loadUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
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

        // Update last_seen timestamp
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Credenciais inválidas');
        return false;
      }

      toast.success('Login realizado com sucesso');
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Erro no login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'viewer'): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, role }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        toast.success('Account created successfully! Please check your email to verify your account.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account');
      return false;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro no logout');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Email de reset enviado');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao enviar email de reset');
    }
  };

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS.admin): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role][permission];
  };

  const getActiveUsers = async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
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