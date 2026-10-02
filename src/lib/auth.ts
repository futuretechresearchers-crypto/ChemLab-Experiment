import { supabase } from './supabase';

export type AuthRole = 'teacher' | 'student';

export type AuthProfile = {
  id: string;
  full_name?: string | null;
  role: AuthRole;
  created_at?: string;
  updated_at?: string;
};

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '/';

  const trimmed = value.trim();
  if (!trimmed) return '/';

  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('//') || normalized.includes('://')) return '/';

  const next = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const safePatterns = [/^\/activity\/[A-Za-z0-9_-]+$/, /^\/teacher(?:\/.*)?$/, /^\/login(?:\/.*)?$/, /^\/$/];

  return safePatterns.some((pattern) => pattern.test(next)) ? next : '/';
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data || (data.role !== 'teacher' && data.role !== 'student')) return null;
  return {
    id: data.id,
    full_name: data.full_name,
    role: data.role,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpUser(payload: { full_name: string; email: string; password: string }) {
  const { full_name, email, password } = payload;
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export function subscribeToAuthState(onChange: (user: any | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ?? null);
  });
}
