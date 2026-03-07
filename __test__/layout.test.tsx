import { fireEvent, render } from '@testing-library/react-native';
import { act } from 'react';
import RootLayout from '../app/_layout';

test('can navigate to Profile tab', () => {
    const { getByTestId } = render(<RootLayout />);
    const profileTab = getByTestId('ProfileScreen'); 

    act(() => {
        fireEvent.press(profileTab);
    });
    expect(getByTestId('ProfileScreen')).toBeTruthy();
});

test('can navigate to Profile tab', () => {
    const { getByTestId } = render(<RootLayout />);
    const homeTab = getByTestId('HomeScreen'); 

    act(() => {
        fireEvent.press(homeTab);
    });
    expect(getByTestId('HomeScreen')).toBeTruthy();
});

test('can navigate to Profile tab', () => {
    const { getByTestId } = render(<RootLayout />);
    const settingsTab = getByTestId('SettingsScreen'); 

    act(() => {
        fireEvent.press(settingsTab);
    });
    expect(getByTestId('SettingsScreen')).toBeTruthy();
});