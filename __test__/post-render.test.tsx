import { render } from '@testing-library/react-native';
import React from 'react';


jest.mock('../Firebaseconfig', () => ({
  auth: { currentUser: { uid: 'test-uid', email: 'test@example.com' } },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
  })),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {},
}));

import Post from '../components/post';

jest.mock('../Firebaseconfig', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}));

test('renders post with title and content', () => {
  const { getByText } = render(
    <Post
      postId='1234'
      author="John Doe"
      item="Test Item"
      description="Test content"
      address="123 Main St"
      image=""
      time="2 hours ago"
    />
  );
  expect(getByText('Test Item')).toBeTruthy();
  expect(getByText('Test content')).toBeTruthy();
  expect(getByText('John Doe')).toBeTruthy();
  expect(getByText('123 Main St')).toBeTruthy();
});