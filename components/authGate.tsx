import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { BottomNavigation, PaperProvider } from "react-native-paper";
import { auth } from "../Firebaseconfig";
import HomeScreen from "../app/index";
import LoginScreen from "../app/loginScreen";
import MapScreen from "../app/mapScreen";
import PostScreen from '../app/postScreen';
import ProfileScreen from "../app/profileScreen";
import SearchScreen from "../app/searchScreen";
import SettingsScreen from "../app/settingsScreen";
import SignUpScreen from './../app/signUpScreen';


export default function AuthGate() {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [index, setIndex] = useState(0);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [showPostScreen, setShowPostScreen] = useState(false);


  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline', testID: 'HomeScreen' },
    { key: 'search', title: 'Search', focusedIcon: 'magnify', unfocusedIcon: 'magnify', testID: 'SearchScreen' },
    { key: 'map', title: 'Map', focusedIcon: 'map', unfocusedIcon: 'map-outline', testID: 'MapScreen' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account-cowboy-hat', unfocusedIcon: 'account-cowboy-hat-outline', testID: 'ProfileScreen' },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline', testID: 'SettingsScreen' },
  ]);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;

  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return authScreen === 'login'
      ? <LoginScreen onGoToSignup={() => setAuthScreen('signup')} />
      : <SignUpScreen onGoToLogin={() => setAuthScreen('login')} />;
  }

  if (showPostScreen) {
    return <PostScreen onBack={() => setShowPostScreen(false)} />;
  }

  const renderScene = BottomNavigation.SceneMap({
    home: () => <HomeScreen onAddPost={() => setShowPostScreen(true)} />,
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