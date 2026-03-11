import * as React from 'react';
import { BottomNavigation, PaperProvider } from 'react-native-paper';
import HomeScreen from './index';
import MapScreen from './mapScreen';
import ProfileScreen from './profileScreen';
import SearchScreen from './searchScreen';
import SettingsScreen from './settingsScreen';

export default function RootLayout() {
  const [index, setIndex] = React.useState(0);
  
  const [routes] = React.useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline', testID: 'HomeScreen' },
    { key: 'search', title: 'Search', focusedIcon: 'magnify', unfocusedIcon: 'magnify', testID: 'SearchScreen' },
    { key: 'map', title: 'Map', focusedIcon: 'map', unfocusedIcon: 'map-outline', testID: 'MapScreen' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline', testID: 'ProfileScreen' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline', testID: 'SettingsScreen' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <HomeScreen />,
    search: () => <SearchScreen />,
    map: () => <MapScreen />,
    profile: () => <ProfileScreen />,
    settings: () => <SettingsScreen />,
  });

  return (
    <PaperProvider>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
      />
    </PaperProvider>
  );
}