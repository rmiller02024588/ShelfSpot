import FollowingScreen from "@/app/followingScreen";
import type { User } from "@supabase/supabase-js";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { BottomNavigation, PaperProvider } from "react-native-paper";
import { onAuthStateChanged } from "../lib/auth";
import { useThemeColors } from "../lib/theme";
import HomeScreen from "../app/index";
import LoginScreen from "../app/loginScreen";
import MapScreen from "../app/mapScreen";
import PostScreen from '../app/postScreen';
import ProfileScreen from "../app/profileScreen";
import SearchScreen from "../app/searchScreen";
import SettingsScreen from "../app/settingsScreen";
import ViewUserProfileScreen from "../app/viewUserProfileScreen";
import { ProfileNavContext } from "../context/ProfileNavContext";
import SignUpScreen from './../app/signUpScreen';


export default function AuthGate() {

  const COLORS = useThemeColors();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [index, setIndex] = useState(0);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [showPostScreen, setShowPostScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showFollowingScreen, setShowFollowingScreen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const prevUidRef = useRef<string | null | undefined>(undefined);

  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline', testID: 'HomeScreen' },
    { key: 'search', title: 'Search', focusedIcon: 'magnify', unfocusedIcon: 'magnify', testID: 'SearchScreen' },
    { key: 'map', title: 'Map', focusedIcon: 'map', unfocusedIcon: 'map-outline', testID: 'MapScreen' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account-cowboy-hat', unfocusedIcon: 'account-cowboy-hat-outline', testID: 'ProfileScreen' },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      const incomingUid = authUser?.id ?? null;

      if (incomingUid !== prevUidRef.current) {
        setIndex(0);
        setShowPostScreen(false);
        setShowSettingsScreen(false);
        setShowFollowingScreen(false);
        setAuthScreen('login');
      }

      prevUidRef.current = incomingUid;
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
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

  if (showSettingsScreen) {
    return <SettingsScreen onBack={() => setShowSettingsScreen(false)} />;
  }

  if (showFollowingScreen) {
    return (
      <ProfileNavContext.Provider value={{
        onViewProfile: (userId) => {
          setShowFollowingScreen(false);
          setViewingUserId(userId);
        }
      }}>
        <FollowingScreen onBack={() => setShowFollowingScreen(false)} />
      </ProfileNavContext.Provider>
    );
  }

  if (viewingUserId) {
    return <ViewUserProfileScreen userId={viewingUserId} onBack={() => setViewingUserId(null)} />;
  }

  const renderScene = BottomNavigation.SceneMap({
    home: () => <HomeScreen onAddPost={() => setShowPostScreen(true)} />,
    search: () => <SearchScreen />,
    map: () => <MapScreen />,
    profile: () => <ProfileScreen onGoToSettings={() => setShowSettingsScreen(true)}
      onGoToFollowing={() => setShowFollowingScreen(true)} />,
  });

  return (
    <ProfileNavContext.Provider value={{ onViewProfile: setViewingUserId }}>
      <PaperProvider>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          barStyle={{ backgroundColor: COLORS.card }}
          theme={{
            colors: {
              secondaryContainer: COLORS.accentLight,
              onSecondaryContainer: COLORS.accent,
            }
          }}
        />
      </PaperProvider>
    </ProfileNavContext.Provider>
  );
}
