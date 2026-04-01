import { render } from '@testing-library/react-native';
import React from 'react';
import Post from '../components/post';

test('renders post with title and content', () => {
  const { getByText } = render(
    <Post
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
