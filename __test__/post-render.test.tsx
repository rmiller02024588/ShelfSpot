import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('../lib/auth', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../Supabaseconfig', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null })),
    })),
    channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn() })),
    removeChannel: jest.fn(),
  },
}));

import Post from '../components/post';

test('renders post with title and content', () => {
  const { getByText } = render(
    <Post
      postId='1234'
      author="John Doe"
      userId="user-uuid-1234"
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
