import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/api/supabase';
import { useAuthStore, useProfileStore } from './store';

interface AuthContextValue {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setUser, setLoading, setInitialized, clearAuth } = useAuthStore();
  const { setProfile, clearProfile } = useProfileStore();

  useEffect(() => {
    // Refresh session when app comes to foreground
    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          supabase.auth.startAutoRefresh();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      }
    );

    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);

      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clearProfile();
          clearAuth();
        }
      }
    );

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet — create default profile
      const { data: newProfile } = await supabase
        .from('users_profiles')
        .insert({ id: userId } as any)
        .select()
        .single();
      if (newProfile) setProfile(newProfile);
    } else if (data) {
      setProfile(data);
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ error: string | null }> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    setLoading(false);

    if (!error && data.user) {
      // Create profile row
      await supabase.from('users_profiles').upsert({
        id: data.user.id,
        display_name: displayName,
      } as any);
    }

    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    clearAuth();
    clearProfile();
    setLoading(false);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'nutrisenseai://reset-password',
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
