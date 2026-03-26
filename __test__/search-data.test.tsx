import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SearchScreen from '../app/searchScreen';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      results: [{ name: { first: 'John', last: 'Doe' }, email: 'john@example.com' }],
    }),
  })
);

// Add beforeEach to clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

test('displays fetched user data', async () => {
  const { getByText } = render(<SearchScreen />);
  await waitFor(() => expect(getByText('John Doe')).toBeTruthy());
});