import AntDesign from '@expo/vector-icons/AntDesign';
import type { User } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { deleteOwnAccount, getAvatarUrl, getDisplayName, getPasswordStrengthError, onAuthStateChanged, syncProfileFromUser } from '../lib/auth';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

export default function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [profile, setProfile] = useState({ name: '', email: '', avatarUrl: '' as string | null });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setProfile({
          name:  getDisplayName(user),
          email: user.email || '',
          avatarUrl: getAvatarUrl(user),
        });
        void syncProfileFromUser(user);
      }
    });
    return unsubscribe;
  }, []);

  const startEdit = (field: string) => {
    if (field === 'email') {
      Alert.alert('Email', 'To change your email, please contact support.');
      return;
    }
    setEditingField(field);
    setTempValue(profile[field as 'name' | 'email'] ?? '');
  };

  const save = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    try {
      if (editingField === 'name') {
        const trimmed = tempValue.trim();
        const { error } = await supabase.auth.updateUser({
          data: { display_name: trimmed },
        });
        if (error) throw error;
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            email: currentUser.email,
            display_name: trimmed,
          });
        if (profileError) throw profileError;
      }
      setProfile(prev => ({ ...prev, [editingField!]: tempValue.trim() }));
      Alert.alert('Success', 'Profile updated successfully');
      setEditingField(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    }
  };

  const cancel = () => setEditingField(null);

  const pickAvatar = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `avatars/${currentUser.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

      if (uploadError) {
        Alert.alert('Upload failed', uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);

      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email,
          avatar_url: publicUrl,
          display_name: getDisplayName(currentUser),
        });
      if (profileError) throw profileError;

      setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
      Alert.alert('Success', 'Profile picture updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill out all password fields.');
      return;
    }
    const passwordError = getPasswordStrengthError(newPassword);
    if (passwordError) {
      Alert.alert('Weak password', passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (reauthError) {
        Alert.alert('Incorrect password', 'Your current password is incorrect.');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onBack?.();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, posts, and saved items. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Your account will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: handleDeleteAccount,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const result = await deleteOwnAccount();
      if (!result.ok) {
        Alert.alert('Error', result.error || 'Failed to delete account');
        return;
      }
      onBack?.();
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const renderField = (label: string, field: 'name' | 'email', readOnly = false) => (
    <View key={field} style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editingField === field ? (
        <>
          <TextInput
            style={styles.input}
            value={tempValue}
            onChangeText={setTempValue}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveTxt}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity onPress={() => startEdit(field)} disabled={readOnly}>
          <Text style={[styles.value, readOnly && { color: COLORS.textSecondary }]}>
            {profile[field] || '—'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const avatarLabel = profile.name
    ? profile.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : (profile.email?.[0]?.toUpperCase() ?? 'U');

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Action
          icon="arrow-left"
          onPress={onBack}
          iconColor={COLORS.text}
        />
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
            <View style={styles.avatarFrame}>
              {profile.avatarUrl ? (
                <Avatar.Image size={90} source={{ uri: profile.avatarUrl }} />
              ) : (
                <Avatar.Text
                  size={90}
                  label={avatarLabel}
                  style={{ backgroundColor: COLORS.accent }}
                  color={COLORS.onAccent}
                />
              )}
              <View style={styles.avatarBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={COLORS.onAccent} />
                ) : (
                  <AntDesign name="camera" size={14} color={COLORS.onAccent} />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile.name || profile.email || 'User'}</Text>
          <Text style={styles.avatarHint}>Tap to change profile picture</Text>
        </View>

        {renderField('Username', 'name')}
        {renderField('Email', 'email', true /* read-only */)}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.passwordBtn, changingPassword && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <ActivityIndicator color={COLORS.onAccent} />
            ) : (
              <Text style={styles.saveTxt}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteAccountBtn, deletingAccount && styles.btnDisabled]}
          onPress={confirmDeleteAccount}
          disabled={deletingAccount}
        >
          {deletingAccount ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <Text style={styles.deleteAccountTxt}>Delete Account</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.background },
  header:        { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 0 },
  headerTitle:   { fontSize: 20, fontWeight: '700', color: COLORS.text },
  container:     { padding: 20, backgroundColor: COLORS.background, flexGrow: 1 },
  avatarWrapper: { alignItems: 'center', marginVertical: 30 },
  avatarFrame:   { width: 90, height: 90 },
  avatarBadge:   {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name:          { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  avatarHint:    { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  field:         { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  section:       { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionTitle:  { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  label:         { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  value:         { color: COLORS.text, fontSize: 16 },
  input:         { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10, color: COLORS.text, backgroundColor: COLORS.inputBg },
  row:           { flexDirection: 'row', gap: 10 },
  saveBtn:       { flex: 1, backgroundColor: COLORS.accent, borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  passwordBtn:   { backgroundColor: COLORS.accent, borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 42, marginTop: 4 },
  btnDisabled:   { opacity: 0.7 },
  saveTxt:       { color: COLORS.onAccent, fontWeight: 'bold' },
  cancelBtn:     { flex: 1, backgroundColor: COLORS.accentLight, borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelTxt:     { color: COLORS.text },
  logoutBtn:     { marginTop: 20, backgroundColor: COLORS.error, borderRadius: 10, padding: 14, alignItems: 'center' },
  logoutTxt:     { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  deleteAccountBtn: {
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteAccountTxt: { color: COLORS.error, fontWeight: 'bold', fontSize: 16 },
});
