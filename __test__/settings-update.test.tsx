import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import SettingsScreen from '../app/settingsScreen';

test('updates username on save', () => {
  const { getByText, getByDisplayValue } = render(<SettingsScreen />);
  fireEvent.press(getByText('johndoe')); // Assuming initial username
  fireEvent.changeText(getByDisplayValue('johndoe'), 'newuser');
  fireEvent.press(getByText('Save'));
  expect(getByText('newuser')).toBeTruthy();
});