import { onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { auth } from '../Firebaseconfig';

const COLORS = {
  background:    '#FAF7F2',
  card:          '#FFFFFF',
  accent:        '#C0784A',
  accentLight:   '#F5EDE4',
  text:          '#2C1A0E',
  textSecondary: '#8C7B6E',
  border:        '#E8DDD4',
  inputBg:       '#FDF9F5',
};

export default function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setProfile({
          name:  user.displayName || '',
          email: user.email || '',
        });
      }
    });
    return unsubscribe;
  }, []);

  const startEdit = (field: string) => {
    // Email is managed by Firebase Auth and requires re-auth to change — make it read-only
    if (field === 'email') {
      Alert.alert('Email', 'To change your email, please contact support.');
      return;
    }
    setEditingField(field);
    setTempValue(profile[field as keyof typeof profile]);
  };

  const save = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    try {
      if (editingField === 'name') {
        await updateProfile(currentUser, { displayName: tempValue.trim() });
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

  // Moved inside component so it can call onBack after logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onBack?.(); // Return to auth screen — AuthGate will handle showing login
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const renderField = (label: string, field: string, readOnly = false) => (
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
            {profile[field as keyof typeof profile] || '—'}
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
        <Appbar.BackAction onPress={onBack} iconColor={COLORS.text} />
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarWrapper}>
          <Avatar.Text
            size={90}
            label={avatarLabel}
            style={{ backgroundColor: COLORS.accent }}
            color="#fff"
          />
          <Text style={styles.name}>{profile.name || profile.email || 'User'}</Text>
        </View>

        {renderField('Name', 'name')}
        {renderField('Email', 'email', true /* read-only */)}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.background },
  header:        { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 0 },
  headerTitle:   { fontSize: 20, fontWeight: '700', color: COLORS.text },
  container:     { padding: 20, backgroundColor: COLORS.background, flexGrow: 1 },
  avatarWrapper: { alignItems: 'center', marginVertical: 30 },
  name:          { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  field:         { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12, shadowColor: '#C0784A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  label:         { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  value:         { color: COLORS.text, fontSize: 16 },
  input:         { borderWidth: 1, borderColor: COLORS.accent, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10, color: COLORS.text, backgroundColor: COLORS.inputBg },
  row:           { flexDirection: 'row', gap: 10 },
  saveBtn:       { flex: 1, backgroundColor: COLORS.accent, borderRadius: 8, padding: 10, alignItems: 'center' },
  saveTxt:       { color: '#fff', fontWeight: 'bold' },
  cancelBtn:     { flex: 1, backgroundColor: COLORS.accentLight, borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelTxt:     { color: COLORS.text },
  logoutBtn:     { marginTop: 20, backgroundColor: '#E74C3C', borderRadius: 10, padding: 14, alignItems: 'center' },
  logoutTxt:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});