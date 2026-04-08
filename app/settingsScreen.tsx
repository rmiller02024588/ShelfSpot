import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Appbar, Avatar } from 'react-native-paper';

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
  const [profile, setProfile] = useState({ name: 'John Doe', email: 'johndoe@example.com', password: 'secret123', username: 'johndoe' });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (field: string) => { setEditingField(field); setTempValue(profile[field as keyof typeof profile]); };
  const save = () => { setProfile({ ...profile, [editingField!]: tempValue }); setEditingField(null); };
  const cancel = () => setEditingField(null);

  const renderField = (label: string, field: string) => (
    <View key={field} style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editingField === field ? (
        <>
          <TextInput
            style={styles.input}
            value={tempValue}
            onChangeText={setTempValue}
            secureTextEntry={field === 'password'}
            autoFocus autoCapitalize="none" autoCorrect={false}
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
        <TouchableOpacity onPress={() => startEdit(field)}>
          <Text style={styles.value}>{field === 'password' ? '••••••••' : profile[field as keyof typeof profile]}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.BackAction onPress={onBack} iconColor={COLORS.text} />
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarWrapper}>
          <Avatar.Text size={90} label="JD" style={{ backgroundColor: COLORS.accent }} color="#fff" />
          <Text style={styles.name}>{profile.name}</Text>
        </View>
        {renderField('Email', 'email')}
        {renderField('Password', 'password')}
        {renderField('Username', 'username')}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginVertical: 30,
  },
  name: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  field: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#C0784A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: COLORS.text,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    color: COLORS.text,
    backgroundColor: COLORS.inputBg,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  saveTxt: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  cancelTxt: {
    color: COLORS.text,
  },
});
