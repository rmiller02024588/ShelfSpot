import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { addDoc } from 'firebase/firestore';
import React from 'react';
import { Alert } from 'react-native';
import PostScreen from '../app/postScreen';

jest.mock('../Firebaseconfig', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  GeoPoint: jest.fn(),
  Timestamp: { fromDate: jest.fn() },
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
      'Missing fields',
      'Please fill out all fields and select at least one category.'
    );
  });
});

test('does not call addDoc when fields are missing', async () => {
  const { getByText } = render(<PostScreen onBack={() => {}} />);
  fireEvent.press(getByText('Post'));
  await waitFor(() => {
    expect(addDoc).not.toHaveBeenCalled();
  });
});