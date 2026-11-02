import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signInWithOAuthProvider } from '../lib/auth';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

export default function LoginScreen({ onGoToSignup }: { onGoToSignup?: () => void }) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const appleContentColor = COLORS.apple === '#FFFFFF' ? COLORS.onAccent : '#FFFFFF';
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const login = async () => {
    if (loading || oauthLoading) return;
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      setErrorMessage('Enter your email above, then tap Forgot password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    Alert.alert('Check your email', 'If an account exists for that address, a reset link has been sent.');
  };

  const loginWithProvider = async (provider: 'google' | 'apple') => {
    if (loading || oauthLoading) return;
    setErrorMessage('');
    setOauthLoading(provider);
    try {
      const result = await signInWithOAuthProvider(provider);
      if (result.cancelled) return;
      if (!result.session) {
        setErrorMessage('Sign-in did not complete. Please try again.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Social sign-in failed');
    } finally {
      setOauthLoading(null);
    }
  };

  const busy = loading || oauthLoading !== null;

  return (
    <Pressable style={styles.root} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.brandBlock}>
          <Text style={styles.appName}>ShelfSpot</Text>
          <Text style={styles.tagline}>Find collectible cards near you</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
              caretHidden={false}
              selectionColor={COLORS.accent}
              cursorColor={COLORS.accent}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              caretHidden={false}
              selectionColor={COLORS.accent}
              cursorColor={COLORS.accent}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={login} disabled={busy}>
            <Text style={styles.primaryBtnText}>{loading ? 'Logging in…' : 'Log In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={forgotPassword} disabled={busy}>
            <Text style={styles.linkBtnText}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, styles.googleBtn]}
              onPress={() => loginWithProvider('google')}
              disabled={busy}
              activeOpacity={0.85}
            >
              <AntDesign name="google" size={18} color="#FFFFFF" />
              <Text style={styles.googleBtnText}>
                {oauthLoading === 'google' ? 'Opening…' : 'Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn]}
              onPress={() => loginWithProvider('apple')}
              disabled={busy}
              activeOpacity={0.85}
            >
              <AntDesign name="apple" size={18} color={appleContentColor} />
              <Text style={[styles.appleBtnText, { color: appleContentColor }]}>
                {oauthLoading === 'apple' ? 'Opening…' : 'Apple'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.ghostBtn} onPress={onGoToSignup} disabled={busy}>
            <Text style={styles.ghostBtnText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: COLORS.onAccent,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkBtnText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginTop: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  googleBtn: {
    backgroundColor: COLORS.google,
  },
  appleBtn: {
    backgroundColor: COLORS.apple,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  appleBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  ghostBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
