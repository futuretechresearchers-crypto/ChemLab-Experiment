import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AuthProfile, AuthRole } from './auth';

type AuthContextValue = {
  user: User | null;
  profile: AuthProfile | null;
  role: AuthRole | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readProfile(userId: string): Promise<AuthProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Your account profile could not be found. Please retry or log out.');
  if (data.role !== 'teacher' && data.role !== 'student') {
    throw new Error('Your account has an invalid role. Please contact your CHEMLAB administrator.');
  }

  return { id: data.id, full_name: data.full_name, role: data.role };
}

export async function getProfileForUser(userId: string): Promise<AuthProfile> {
  return readProfile(userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setProfileError(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        return;
      }
      setProfile(await readProfile(currentUser.id));
    } catch (caught) {
      setProfile(null);
      setProfileError(caught instanceof Error ? caught.message : 'Your account profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const load = async (nextUser: User | null) => {
      const id = ++requestId;
      if (!active) return;
      setUser(nextUser);
      setProfile(null);
      setProfileError(null);
      setLoading(true);
      if (!nextUser) {
        setLoading(false);
        return;
      }
      try {
        const nextProfile = await readProfile(nextUser.id);
        if (active && requestId === id) setProfile(nextProfile);
      } catch (caught) {
        if (active && requestId === id) setProfileError(caught instanceof Error ? caught.message : 'Your account profile could not be loaded.');
      } finally {
        if (active && requestId === id) setLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (active) void load(data.session?.user ?? null);
    }).catch((caught: unknown) => {
      if (!active) return;
      setUser(null);
      setProfile(null);
      setProfileError(caught instanceof Error ? caught.message : 'Supabase authentication is unavailable.');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Run the profile query after the auth callback returns to avoid holding the
      // Supabase auth lock while making another Supabase request.
      window.setTimeout(() => { if (active) void load(session?.user ?? null); }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, profile, role: profile?.role ?? null, loading, profileError,
    refreshProfile,
    signOut: async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; },
  }), [user, profile, loading, profileError, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
