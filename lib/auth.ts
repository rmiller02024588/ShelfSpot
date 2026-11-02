import type { Provider, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../Supabaseconfig';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/** At least 8 chars, with upper, lower, number, and special character. */
export function getPasswordStrengthError(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include a number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a special character.';
  }
  return null;
}

function resolveDisplayName(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const candidates = [
    meta.display_name,
    meta.full_name,
    meta.name,
    [meta.given_name, meta.family_name].filter(Boolean).join(' '),
  ];
  for (const value of candidates) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed) return trimmed;
  }
  return null;
}

export function getDisplayName(user: User | null): string {
  if (!user) return 'Unknown';
  return resolveDisplayName(user) || user.email?.split('@')[0] || 'Unknown';
}

export function getAvatarUrl(user: User | null): string | null {
  if (!user) return null;
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
}

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

/** OAuth sign-in via Google or Apple (requires providers enabled in Supabase). */
export async function signInWithOAuthProvider(provider: Extract<Provider, 'google' | 'apple'>) {
  const redirectTo = makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { cancelled: true as const, session: null };
  }

  const session = await createSessionFromUrl(result.url);
  if (session?.user) {
    await syncProfileFromUser(session.user);
  }

  return { cancelled: false as const, session };
}

/** Keep public.profiles in sync with auth user_metadata (source posts read from). */
export async function syncProfileFromUser(user: User): Promise<void> {
  const displayName = resolveDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  if (!user.email) return;

  const { data: existing } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: displayName,
      avatar_url: avatarUrl,
    });
    return;
  }

  const updates: { display_name?: string; avatar_url?: string } = {};
  if (displayName && existing.display_name !== displayName) {
    updates.display_name = displayName;
  }
  if (avatarUrl && existing.avatar_url !== avatarUrl) {
    updates.avatar_url = avatarUrl;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('profiles').update(updates).eq('id', user.id);
  }
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}
