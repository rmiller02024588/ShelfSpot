import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';

export default function SettingsScreen() {
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarWrapper}>
        <Avatar.Text size={90} label="JD" style={{ backgroundColor: '#4a90d9' }} color="#fff" />
        <Text style={styles.name}>{profile.name}</Text>
      </View>
      {renderField('Email', 'email')}
      {renderField('Password', 'password')}
      {renderField('Username', 'username')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#1a1a1f', flexGrow: 1 },
  avatarWrapper: { alignItems: 'center', marginVertical: 30 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  field: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  label: { color: '#888', fontSize: 12, marginBottom: 4 },
  value: { color: '#1a1a1f', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#4a90d9', borderRadius: 6, padding: 10, fontSize: 16, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, backgroundColor: '#4a90d9', borderRadius: 6, padding: 10, alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { flex: 1, backgroundColor: '#ccc', borderRadius: 6, padding: 10, alignItems: 'center' },
  cancelTxt: { color: '#333' },
});
