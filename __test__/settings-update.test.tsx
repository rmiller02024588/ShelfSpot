import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SettingsScreen from '../app/settingsScreen';

jest.mock('../lib/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
  getDisplayName: jest.fn(() => 'User'),
  getAvatarUrl: jest.fn(() => null),
  syncProfileFromUser: jest.fn(() => Promise.resolve()),
  deleteOwnAccount: jest.fn(() => Promise.resolve({ ok: true })),
}));

jest.mock('../Supabaseconfig', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(() => Promise.resolve({ error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      eq: jest.fn(() => Promise.resolve({ error: null })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
      })),
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));

jest.mock('react-native-paper', () => ({
  Avatar: {
    Text: ({ label }: any) => {
      const { Text } = require('react-native');
      return <Text>{label}</Text>;
    },
    Image: () => {
      const { View } = require('react-native');
      return <View testID="avatar-image" />;
    },
  },
  Appbar: {
    Header: ({ children }: any) => {
      const { View } = require('react-native');
      return <View>{children}</View>;
    },
    BackAction: () => null,
    Action: () => null,
    Content: ({ title }: any) => {
      const { Text } = require('react-native');
      return <Text>{title}</Text>;
    },
  },
}));

test('renders the logged-in user name default (User)', async () => {
  const { getByText } = await render(<SettingsScreen />);

  await waitFor(() => {
    expect(getByText('User')).toBeTruthy();
  });
});

test('renders change password section', async () => {
  const { getByText, getByPlaceholderText } = await render(<SettingsScreen />);

  await waitFor(() => {
    expect(getByText('Change Password')).toBeTruthy();
    expect(getByPlaceholderText('Current password')).toBeTruthy();
    expect(getByPlaceholderText('New password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
    expect(getByText('Update Password')).toBeTruthy();
  });
});

test('renders delete account button', async () => {
  const { getByText } = await render(<SettingsScreen />);

  await waitFor(() => {
    expect(getByText('Delete Account')).toBeTruthy();
  });
});
