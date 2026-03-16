import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Shape of the user's profile data
interface UserProfile {
  name: string;
  email: string;
  password: string;
  username: string;
}

export default function ProfileScreen() {

  // The user's profile data
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'secret123',
    username: 'johndoe',
  });

  // Which field is open for editing — null means display mode
  const [editingField, setEditingField] = useState<'email' | 'password' | 'username' | null>(null);

  // Temporary value while the user is typing, discarded on Cancel
  const [tempValue, setTempValue] = useState<string>('');

  // Derives initials from a full name, e.g. "John Doe" → "JD"
  const getInitials = (name: string): string =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase();

  // Opens a field for editing and pre-fills the input with its current value
  const handleFieldPress = (field: 'email' | 'password' | 'username') => {
    setEditingField(field);
    setTempValue(profile[field]);
  };

  // Saves the typed value into the profile and returns to display mode
  const handleSave = () => {
    if (editingField === null) return;
    setProfile({ ...profile, [editingField]: tempValue });
    setEditingField(null);
    setTempValue('');
  };

  // Discards any typed changes and returns to display mode
  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  // Renders one field row in either edit mode (TextInput) or display mode (tappable row)
  const renderFieldRow = (label: string, field: 'email' | 'password' | 'username') => {
    if (editingField === field) {
      return (
        <View key={field} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.textInput}
            value={tempValue}
            onChangeText={setTempValue}
            secureTextEntry={field === 'password'}
            autoFocus={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={field}
        style={styles.fieldContainer}
        onPress={() => handleFieldPress(field)}
        activeOpacity={0.7}
      >
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldValueRow}>
          <Text style={styles.fieldValue}>
            {field === 'password' ? '••••••••' : profile[field]}
          </Text>
          <View style={styles.fieldHintRow}>
            <Text style={styles.tapHint}>Tap to edit</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Shelf Spot" />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Avatar.Text
              size={90}
              label={getInitials(profile.name)}
              style={{ backgroundColor: '#4a90d9' }}
              color="#ffffff"
            />
          </View>

          <Text style={styles.nameText}>{profile.name}</Text>

          {/* Profile fields */}
          <View style={styles.fieldsSection}>
            {renderFieldRow('Email', 'email')}
            {renderFieldRow('Password', 'password')}
            {renderFieldRow('Username', 'username')}
          </View>

          <Text style={styles.backendNote}>
            Backend not connected — changes are saved locally only.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// TODO: replace hardcoded profile state with API calls when backend is ready

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1f',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldsSection: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },
  fieldValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldValue: {
    color: '#1a1a1f',
    fontSize: 16,
  },
  fieldHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapHint: {
    color: '#aaaaaa',
    fontSize: 12,
    marginRight: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#4a90d9',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#1a1a1f',
    marginTop: 4,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4a90d9',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#cccccc',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 14,
  },
  backendNote: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 20,
  },
});
