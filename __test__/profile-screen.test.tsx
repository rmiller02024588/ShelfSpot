import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ProfileScreen from '../app/profileScreen';

jest.mock('../Firebaseconfig', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: '1',
          data: () => ({
            author: 'test@example.com',
            item: 'Pepsi',
            description: 'Two left',
            address: '123 Main St',
            imageURL: '',
            time: { toDate: () => new Date('2026-01-01') },
          }),
        },
      ],
    })
  ),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('react-native-paper', () => ({
  Avatar: {
    Text: ({ label }: any) => {
      const { Text } = require('react-native');
      return <Text>{label}</Text>;
    },
  },
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
  expect(getByText('John Doe')).toBeTruthy();
});

test('renders the avatar initials', () => {
  const { getByText } = render(<ProfileScreen />);
  expect(getByText('JD')).toBeTruthy();
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

test('switches to Saves tab when pressed', async () => {
  const { getByText, queryByText } = render(<ProfileScreen />);
  await waitFor(() => expect(getByText('Pepsi')).toBeTruthy());
  fireEvent.press(getByText('Saves'));
  await waitFor(() => {
    expect(queryByText('Pepsi')).toBeNull();
  });
});