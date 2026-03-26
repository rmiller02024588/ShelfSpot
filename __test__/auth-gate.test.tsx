import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import AuthGate from '../components/authGate';

jest.mock('../Firebaseconfig', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

test('shows login screen when user is not authenticated', async () => {
  const { onAuthStateChanged } = require('firebase/auth');
  onAuthStateChanged.mockImplementationOnce((_auth: any, callback: (user: any) => void) => {
    callback(null); // No user logged in
    return () => {};
  });

  const { getByText, queryByText } = await waitFor(() => render(<AuthGate />));
  expect(getByText('Login')).toBeTruthy();
  expect(queryByText('Home')).toBeNull();
});

test('shows app navigation when user is authenticated', async () => {
  const { onAuthStateChanged } = require('firebase/auth');
  onAuthStateChanged.mockImplementationOnce((_auth: any, callback: (user: any) => void) => {
    callback({ uid: 'test-user' });
    return () => {};
  });

  const { getAllByText, queryByText } = await waitFor(() => render(<AuthGate />));
  expect(getAllByText('Home').length).toBeGreaterThan(0);
  expect(queryByText('Login')).toBeNull();
});