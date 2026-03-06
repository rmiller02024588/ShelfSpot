import * as React from 'react';
import { BottomNavigation, PaperProvider } from 'react-native-paper';
import HomeScreen from './index';
import ProfileScreen from './profileScreen';
import SettingsScreen from './settingsScreen';

export default function RootLayout() {
  const [index, setIndex] = React.useState(0);
  
  const [routes] = React.useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <HomeScreen />,
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