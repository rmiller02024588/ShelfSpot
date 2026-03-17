import { render } from '@testing-library/react-native';
import React from 'react';
import Post from '../components/post';

test('renders post with title and content', () => {
  const { getByText } = render(
    <Post title="Test Title" subtitle="1 hour ago" content="Test content" />
  );
  expect(getByText('Test Title')).toBeTruthy();
  expect(getByText('Test content')).toBeTruthy();
});