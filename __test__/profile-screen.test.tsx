import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ProfileScreen from '../app/profileScreen';

jest.mock('../Firebaseconfig', () => ({
  auth: { currentUser: { uid: 'test-uid', email: 'test@example.com', displayName: 'test' } },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-uid', email: 'test@example.com', displayName: 'test' });
    return jest.fn();
  }),
}));

jest.mock('firebase/firestore', () => {
  const mockOwnPost = {
    id: '1',
    data: () => ({
      author: 'test@example.com',
      item: 'Pepsi',
      description: 'Two left',
      address: '123 Main St',
      imageURL: '',
      time: { toDate: () => new Date('2026-01-01') },
    }),
  };

  const mockSavedPost = {
    id: 'saved-1',
    data: () => ({
      author: 'test@example.com',
      item: 'Saved Item',
      description: 'Saved description',
      address: '456 Save St',
      imageURL: '',
      time: { toDate: () => new Date('2026-01-01') },
    }),
  };

  return {
    collection: jest.fn(() => 'mock-collection'),
    doc: jest.fn(() => 'mock-doc-ref'),
    getDoc: jest.fn(() => Promise.resolve(mockSavedPost)),
    onSnapshot: jest.fn((query, callback) => {
      callback({ docs: [mockOwnPost] });
      return jest.fn();
    }),
    getCountFromServer: jest.fn(() =>
      Promise.resolve({ data: () => ({ count: 0 }) })
    ),
  };
});

jest.mock('react-native-paper', () => ({
  Avatar: {
    Text: ({ label }: any) => {
      const { Text } = require('react-native');
      return <Text>{label}</Text>;
    },
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../components/post', () => {
  const { Text, View } = require('react-native');
  function MockPost({ item, description, author, address }: any) {
    return (
      <View>
        <Text>{item}</Text>
        <Text>{description}</Text>
        <Text>{author}</Text>
        <Text>{address}</Text>
      </View>
    );
  }
  return MockPost;
});

test('renders the user name', () => {
  const { getByText } = render(<ProfileScreen />);
  expect(getByText('test')).toBeTruthy();
});

test('renders the avatar initials', () => {
  const { getByText } = render(<ProfileScreen />);
  expect(getByText('TE')).toBeTruthy();
});

test('renders Posts and Saves tabs', () => {
  const { getByText } = render(<ProfileScreen />);
  expect(getByText('Posts')).toBeTruthy();
  expect(getByText('Saves')).toBeTruthy();
});

test('renders post data after fetch', async () => {
  const { getByText } = render(<ProfileScreen />);
  await waitFor(() => {
    expect(getByText('Pepsi')).toBeTruthy();
    expect(getByText('Two left')).toBeTruthy();
    expect(getByText('123 Main St')).toBeTruthy();
  });
});

test('switches to Saves tab and hides posts', async () => {
  const { getByText, queryByText } = render(<ProfileScreen />);
  await waitFor(() => expect(getByText('Pepsi')).toBeTruthy());
  fireEvent.press(getByText('Saves'));
  await waitFor(() => {
    expect(queryByText('Pepsi')).toBeNull();
  });
});