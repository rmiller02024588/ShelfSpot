import { render } from '@testing-library/react-native';
import React from 'react';
import SettingsScreen from '../app/settingsScreen';

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

test('renders settings page successfully', () => {
  const { getByText } = render(<SettingsScreen />);
  expect(getByText('John Doe')).toBeTruthy();
});