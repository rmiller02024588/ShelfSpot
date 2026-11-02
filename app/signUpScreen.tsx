import React, { useMemo, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getPasswordStrengthError, isValidEmail } from "../lib/auth";
import { useThemeColors, type AppColors } from "../lib/theme";
import { supabase } from "../Supabaseconfig";

export default function SignUpScreen({ onGoToLogin }: { onGoToLogin?: () => void }) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const makeAccount = async () => {
    if (loading) return;
    setErrorMessage("");

    if (!email.trim() || !password || !confirmPassword || !displayName.trim()) {
      setErrorMessage('Please enter an email, password, and display name.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const passwordError = getPasswordStrengthError(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const trimmedName = displayName.trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: trimmedName },
        },
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // Keep public profiles in sync when signup returns an active session.
      if (data.user && data.session) {
        await supabase
          .from('profiles')
          .update({ display_name: trimmedName })
          .eq('id', data.user.id);
      }

      if (!data.session) {
        Alert.alert(
          'Check your email',
          'Account created. Confirm your email, then log in.',
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable style={styles.root} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.brandBlock}>
          <Text style={styles.appName}>ShelfSpot</Text>
          <Text style={styles.tagline}>Start sharing card finds near you</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join ShelfSpot</Text>

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
            <Text style={styles.hintText}>
              8+ characters with upper, lower, number, and special character
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
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
              placeholder="Display Name"
              placeholderTextColor={COLORS.textSecondary}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
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

          <TouchableOpacity style={styles.primaryBtn} onPress={makeAccount} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? 'Creating…' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onGoToLogin}>
            <Text style={styles.ghostBtnText}>Already have an account? Log in</Text>
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
  hintText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
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
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  ghostBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
