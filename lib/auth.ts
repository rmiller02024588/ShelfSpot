import type { User } from '@supabase/supabase-js';
import { supabase } from '../Supabaseconfig';

export function getDisplayName(user: User | null): string {
  if (!user) return 'Unknown';
  return user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown';
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
