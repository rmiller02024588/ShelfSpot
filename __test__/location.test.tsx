import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-map-clustering', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapClustering = ({ children, style, ...props }) =>
    React.createElement(View, { testID: 'map', style, ...props }, children);

  return {
    __esModule: true,
    default: MockMapClustering,
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = ({ children, ...props }) => React.createElement(View, { testID: 'map', ...props }, children);
  const Marker = ({ children }) => React.createElement(View, { testID: 'marker' }, children);
  const Circle = ({ children }) => React.createElement(View, { testID: 'circle' }, children);

  return {
    __esModule: true,
    default: MockMap,
    Marker,
    Circle,
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 42.6500221, longitude: -71.3241605 }
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{
    street: '220 pawtucket st'
  }])
}));

jest.mock('../lib/auth', () => ({
  onAuthStateChanged: jest.fn((callback) => {
    callback({ id: 'test-uid', email: 'test@example.com' });
    return jest.fn();
  }),
}));

jest.mock('../Supabaseconfig', () => {
  const mockChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() };
  const mockPost = {
    id: '1',
    user_id: 'test-uid',
    author: 'test',
    item: 'Pepsi',
    description: 'Two left',
    address: '123 Main St',
    image_url: '',
    time: '2026-01-01T00:00:00.000Z',
    type: '1',
    latitude: 42.6500221,
    longitude: -71.3241605,
    exp_date: '2026-02-01T00:00:00.000Z',
  };
  const createQuery = (data: unknown[] = []) => {
    const result = Promise.resolve({ data, error: null });
    const query: Record<string, jest.Mock> = {};
    const chain = () => query;
    query.select = jest.fn(chain);
    query.eq = jest.fn(chain);
    query.then = jest.fn((resolve, reject) => result.then(resolve, reject));
    query.catch = jest.fn((reject) => result.catch(reject));
    return query;
  };

  return {
    supabase: {
      from: jest.fn(() => createQuery([mockPost])),
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(),
    },
  };
});

const MapScreen = require('../app/mapScreen').default;
const getUserLocation = require('../app/mapScreen').getUserLocation;

describe('MapScreen', () => {
  test('renders the map', async () => {
    const { getByTestId } = render(<MapScreen />);
    await waitFor(() => {
      expect(getByTestId('map')).toBeTruthy();
    });
  });

  test('renders at least one marker', async () => {
    const { getAllByTestId } = render(<MapScreen />);
    await waitFor(() => {
      const markers = getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });
  });

});

describe('getUserLocation', () => {
  test('get user location returns the correct coordinates', async () => {
    const [lat, lon, address] = await getUserLocation();
    expect(lat).toBe(42.6500221);
    expect(lon).toBe(-71.3241605);
    expect(address.street).toBe('220 pawtucket st');
  });
});
