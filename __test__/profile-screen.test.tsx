import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ProfileScreen from '../app/profileScreen';

const mockPost = {
  id: '1',
  user_id: 'test-uid',
  author: 'test',
  item: 'Charizard',
  description: 'Two left',
  address: '123 Main St',
  image_url: '',
  time: '2026-01-01T00:00:00.000Z',
  type: 'pokemon',
  latitude: 0,
  longitude: 0,
  exp_date: '2026-02-01T00:00:00.000Z',
};

jest.mock('../lib/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    callback({ id: 'test-uid', email: 'test@example.com', user_metadata: { display_name: 'test' } });
    return jest.fn();
  }),
  getDisplayName: jest.fn(() => 'test'),
  getAvatarUrl: jest.fn(() => null),
  syncProfileFromUser: jest.fn(() => Promise.resolve()),
  getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-uid', email: 'test@example.com' })),
}));

jest.mock('../Supabaseconfig', () => {
  const mockChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() };
  const createQuery = (data: unknown[] = [], count = 0, single: unknown = null) => {
    const result = Promise.resolve({ data, error: null, count });
    const query: Record<string, jest.Mock> = {};
    const chain = () => query;
    query.select = jest.fn(chain);
    query.eq = jest.fn(chain);
    query.in = jest.fn(chain);
    query.order = jest.fn(chain);
    query.maybeSingle = jest.fn(() => Promise.resolve({ data: single, error: null }));
    query.then = jest.fn((resolve, reject) => result.then(resolve, reject));
    query.catch = jest.fn((reject) => result.catch(reject));
    return query;
  };

  return {
    supabase: {
      from: jest.fn((table: string) => {
        if (table === 'posts') return createQuery([mockPost]);
        if (table === 'saved_posts') return createQuery([]);
        if (table === 'following') return createQuery([], 0);
        if (table === 'profiles') return createQuery([], 0, { avatar_url: null });
        if (table === 'stock_votes') return createQuery([]);
        return createQuery();
      }),
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(),
    },
  };
});

jest.mock('react-native-paper', () => ({
  Avatar: {
    Text: ({ label }: any) => {
      const { Text } = require('react-native');
      return <Text>{label}</Text>;
    },
    Image: () => {
      const { View } = require('react-native');
      return <View testID="avatar-image" />;
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

test('renders the user name', async () => {
  const { getAllByText } = await render(<ProfileScreen />);
  expect(getAllByText('test').length).toBeGreaterThan(0);
});

test('renders the avatar initials', async () => {
  const { getByText } = await render(<ProfileScreen />);
  expect(getByText('TE')).toBeTruthy();
});

test('renders Posts and Saves tabs', async () => {
  const { getByText, getAllByText } = await render(<ProfileScreen />);
  expect(getAllByText('Posts').length).toBeGreaterThan(0);
  expect(getByText('Saves')).toBeTruthy();
  expect(getByText('Followers')).toBeTruthy();
});

test('renders post data after fetch', async () => {
  const { getByText } = await render(<ProfileScreen />);
  await waitFor(() => {
    expect(getByText('Charizard')).toBeTruthy();
    expect(getByText('Two left')).toBeTruthy();
    expect(getByText('123 Main St')).toBeTruthy();
  });
});

test('switches to Saves tab and hides posts', async () => {
  const { getByText, queryByText } = await render(<ProfileScreen />);
  await waitFor(() => expect(getByText('Charizard')).toBeTruthy());
  fireEvent.press(getByText('Saves'));
  await waitFor(() => {
    expect(queryByText('Charizard')).toBeNull();
  });
});
