import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SettingsScreen from '../app/settingsScreen';

jest.mock('../lib/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
  getDisplayName: jest.fn(() => 'User'),
}));

jest.mock('../Supabaseconfig', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(() => Promise.resolve({ error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

jest.mock('react-native-paper', () => ({
  Avatar: {
    Text: ({ label }: any) => {
      const { Text } = require('react-native');
      return <Text>{label}</Text>;
    },
  },
  Appbar: {
    Header: ({ children }: any) => {
      const { View } = require('react-native');
      return <View>{children}</View>;
    },
    BackAction: () => null,
    Content: ({ title }: any) => {
      const { Text } = require('react-native');
      return <Text>{title}</Text>;
    },
  },
}));

test('renders the logged-in user name default (User)', async () => {
  const { getByText } = render(<SettingsScreen />);

  await waitFor(() => {
    expect(getByText('User')).toBeTruthy();
  });
});
