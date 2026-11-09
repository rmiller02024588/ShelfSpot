import type { Provider, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../Supabaseconfig';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse query + hash params from an OAuth redirect URL (avoids private expo-auth-session paths). */
function getQueryParams(input: string): { params: Record<string, string>; errorCode: string | null } {
  const url = new URL(input, 'https://phony.example');
  const errorCode = url.searchParams.get('errorCode') ?? url.searchParams.get('error');
  url.searchParams.delete('errorCode');
  url.searchParams.delete('error');

  const params: Record<string, string> = Object.fromEntries(url.searchParams.entries());
  if (url.hash) {
    new URLSearchParams(url.hash.replace(/^#/, '')).forEach((value, key) => {
      params[key] = value;
    });
  }

  return { params, errorCode };
}

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
  const { params, errorCode } = getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  // PKCE flow (default for supabase-js): exchange auth code for a session
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

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
  const email = user.email?.trim() || `${user.id}@users.noreply`;

  const { data: existing } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
    });
    return;
  }

  const updates: { display_name?: string; avatar_url?: string; email?: string } = {};
  if (displayName && existing.display_name !== displayName) {
    updates.display_name = displayName;
  }
  if (avatarUrl && existing.avatar_url !== avatarUrl) {
    updates.avatar_url = avatarUrl;
  }
  if (user.email && existing.email !== user.email) {
    updates.email = user.email;
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

/**
 * Permanently delete the signed-in user's account and related data.
 * Requires the `delete_own_account` RPC from supabase/schema.sql.
 */
export async function deleteOwnAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { error } = await supabase.rpc('delete_own_account');
  if (error) {
    console.error('Error deleting account:', error);
    return { ok: false, error: error.message };
  }

  await supabase.auth.signOut();
  return { ok: true };
}
