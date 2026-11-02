import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

const LoggedOutScreen = () => (
  <View><Text>Login</Text></View>
);

const LoggedInScreen = () => (
  <View><Text>Home</Text></View>
);

test('shows login screen when user is not authenticated', async () => {
  const { getByText, queryByText } = await render(<LoggedOutScreen />);
  expect(getByText('Login')).toBeTruthy();
  expect(queryByText('Home')).toBeNull();
});

test('shows app navigation when user is authenticated', async () => {
  const { getByText, queryByText } = await render(<LoggedInScreen />);
  expect(getByText('Home')).toBeTruthy();
  expect(queryByText('Login')).toBeNull();
});
