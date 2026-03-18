import { render } from '@testing-library/react-native';
import React from 'react';
import AuthGate from '../components/authGate';

jest.mock('../Firebaseconfig', () => ({ auth: {} }));

// When no user is logged in, AuthGate should show the login screen and hide the app navigation.
test('shows login screen when user is not authenticated', () => {
  const { getByText, queryByText } = render(<AuthGate />);
  expect(getByText('Login')).toBeTruthy();
  expect(queryByText('Home')).toBeNull();
});

// When a user is logged in, AuthGate should show the app navigation and hide the login screen.
test('shows app navigation when user is authenticated', () => {
  const { onAuthStateChanged } = require('firebase/auth');
  onAuthStateChanged.mockImplementationOnce((_auth: any, callback: (user: any) => void) => {
    callback({ uid: 'test-user' });
    return () => {};
  });

  const { getAllByText, queryByText } = render(<AuthGate />);
  expect(getAllByText('Home').length).toBeGreaterThan(0);
  expect(queryByText('Login')).toBeNull();
});
