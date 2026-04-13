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
  const MockMap = ({ children, ...props }) => React.createElement(View, props, children);
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
