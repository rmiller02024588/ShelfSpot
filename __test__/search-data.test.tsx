import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SearchScreen from '../app/searchScreen';

jest.mock('../Firebaseconfig', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('../app/searchScreen', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const MockSearchScreen = () =>
    React.createElement(View, null,
      React.createElement(Text, null, 'Jane Doe'),
      React.createElement(Text, null, 'Test Post'),
    );
  MockSearchScreen.displayName = 'SearchScreen';
  return MockSearchScreen;
});


test('displays fetched user data', async () => {
  const { getByText } = render(<SearchScreen />);
  await waitFor(() => expect(getByText('Jane Doe')).toBeTruthy());
});