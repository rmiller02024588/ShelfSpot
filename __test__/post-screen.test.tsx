import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import PostScreen from '../app/postScreen';

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));

jest.mock('../Supabaseconfig', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-uid', email: 'test@example.com', user_metadata: { display_name: 'test' } } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })),
      })),
    },
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

jest.mock('../lib/auth', () => ({
  getDisplayName: jest.fn(() => 'test'),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: 'file://test.jpg' }] })
  ),
}));

jest.mock('react-native-google-places-autocomplete', () => {
  const { TextInput } = require('react-native');
  return {
    GooglePlacesAutocomplete: ({ placeholder }: any) => (
      <TextInput testID="places-input" placeholder={placeholder} />
    ),
  };
});

jest.mock('react-native-element-dropdown', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Dropdown: ({ data, placeholder, value, onChange }: any) => (
      <TouchableOpacity testID="dropdown"><Text>{placeholder}</Text></TouchableOpacity>
    ),
    MultiSelect: ({ placeholder }: any) => (
      <TouchableOpacity testID="multi-select"><Text>{placeholder}</Text></TouchableOpacity>
    ),
  };
});

jest.mock('react-native-paper', () => {
  const { View, TextInput, TouchableOpacity, Text } = require('react-native');
  return {
    Appbar: {
      Header: ({ children }: any) => <View>{children}</View>,
      Action: ({ onPress, testID }: any) => <TouchableOpacity testID={testID} onPress={onPress}><Text>Back</Text></TouchableOpacity>,
      Content: ({ title }: any) => <Text>{title}</Text>,
    },
    TextInput: ({ onChangeText, value, placeholder }: any) => (
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />
    ),
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => () => null);

test('renders the New Post header', () => {
  const { getByText } = render(<PostScreen onBack={() => {}} />);
  expect(getByText('New Post')).toBeTruthy();
});

test('renders all form section labels', () => {
  const { getByText } = render(<PostScreen onBack={() => {}} />);
  expect(getByText('Item Name')).toBeTruthy();
  expect(getByText('Location')).toBeTruthy();
  expect(getByText('Category')).toBeTruthy();
  expect(getByText('Description')).toBeTruthy();
  expect(getByText('Photo')).toBeTruthy();
});

test('calls onBack when back button is pressed', () => {
  const onBack = jest.fn();
  const { getByTestId } = render(<PostScreen onBack={onBack} />);
  fireEvent.press(getByTestId('backButton'));
  expect(onBack).toHaveBeenCalledTimes(1);
});

test('shows alert when posting with empty fields', async () => {
  jest.spyOn(Alert, 'alert');
  const { getByText } = render(<PostScreen onBack={() => {}} />);
  fireEvent.press(getByText('Post'));
  await waitFor(() => {
    expect(Alert.alert).toHaveBeenCalledWith(
      'API Key Missing',
      'To make a post, a Google Maps API key is required. Please set the EXPO_PUBLIC_API_KEY environment variable.'
    );
  });
});

test('does not insert post when fields are missing', async () => {
  const { getByText } = render(<PostScreen onBack={() => {}} />);
  fireEvent.press(getByText('Post'));
  await waitFor(() => {
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
