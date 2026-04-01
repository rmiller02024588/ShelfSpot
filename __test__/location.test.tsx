import { render } from '@testing-library/react-native';
import React from 'react';
import MapScreen from '../app/mapScreen';

const getUserLocation = require('../app/mapScreen').getUserLocation;

// mock the map library
jest.mock('react-native-maps');

// mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 42.6500221, longitude: -71.3241605 }
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{
    street: '220 pawtucket st'
  }])
}));

describe('MapScreen', () => {
  test('renders the map', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map')).toBeTruthy();
  });

  test('renders at least one marker', () => {
    const { getAllByTestId } = render(<MapScreen />);
    const markers = getAllByTestId('marker');

    expect(markers.length).toBeGreaterThan(0);
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
