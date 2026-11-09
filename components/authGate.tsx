import FollowingScreen from "@/app/followingScreen";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { User } from "@supabase/supabase-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { onAuthStateChanged } from "../lib/auth";
import { useThemeColors, type AppColors } from "../lib/theme";
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

type TabRoute = {
  key: string;
  title: string;
  focusedIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  unfocusedIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  testID: string;
};

export default function AuthGate() {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [index, setIndex] = useState(0);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [showPostScreen, setShowPostScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showFollowingScreen, setShowFollowingScreen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const prevUidRef = useRef<string | null | undefined>(undefined);

  const routes: TabRoute[] = [
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline', testID: 'HomeScreen' },
    { key: 'search', title: 'Search', focusedIcon: 'magnify', unfocusedIcon: 'magnify', testID: 'SearchScreen' },
    { key: 'map', title: 'Map', focusedIcon: 'map', unfocusedIcon: 'map-outline', testID: 'MapScreen' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account-cowboy-hat', unfocusedIcon: 'account-cowboy-hat-outline', testID: 'ProfileScreen' },
  ];

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
    return (
      <PaperProvider>
        <PostScreen onBack={() => setShowPostScreen(false)} />
      </PaperProvider>
    );
  }

  if (showSettingsScreen) {
    return (
      <PaperProvider>
        <SettingsScreen onBack={() => setShowSettingsScreen(false)} />
      </PaperProvider>
    );
  }

  if (showFollowingScreen) {
    return (
      <PaperProvider>
        <ProfileNavContext.Provider value={{
          onViewProfile: (userId) => {
            setShowFollowingScreen(false);
            setViewingUserId(userId);
          }
        }}>
          <FollowingScreen onBack={() => setShowFollowingScreen(false)} />
        </ProfileNavContext.Provider>
      </PaperProvider>
    );
  }

  if (viewingUserId) {
    return (
      <PaperProvider>
        <ViewUserProfileScreen userId={viewingUserId} onBack={() => setViewingUserId(null)} />
      </PaperProvider>
    );
  }

  let activeScene: React.ReactNode = null;
  if (index === 0) {
    activeScene = <HomeScreen onAddPost={() => setShowPostScreen(true)} />;
  } else if (index === 1) {
    activeScene = <SearchScreen />;
  } else if (index === 2) {
    activeScene = <MapScreen />;
  } else if (index === 3) {
    activeScene = (
      <ProfileScreen
        onGoToSettings={() => setShowSettingsScreen(true)}
        onGoToFollowing={() => setShowFollowingScreen(true)}
      />
    );
  }

  return (
    <ProfileNavContext.Provider value={{ onViewProfile: setViewingUserId }}>
      <PaperProvider>
        <View style={styles.root}>
          <View style={styles.sceneContainer}>
            {activeScene}
          </View>

          <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {routes.map((route, routeIndex) => {
              const focused = index === routeIndex;
              const color = focused ? COLORS.accent : COLORS.textSecondary;
              return (
                <Pressable
                  key={route.key}
                  testID={route.testID}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={route.title}
                  onPress={() => setIndex(routeIndex)}
                  style={styles.tabItem}
                >
                  <View style={[styles.tabIconWrap, focused && styles.tabIconWrapFocused]}>
                    <MaterialCommunityIcons
                      name={focused ? route.focusedIcon : route.unfocusedIcon}
                      size={22}
                      color={color}
                    />
                  </View>
                  <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                    {route.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </PaperProvider>
    </ProfileNavContext.Provider>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sceneContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
  tabIconWrap: {
    width: 56,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapFocused: {
    backgroundColor: COLORS.accentLight,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
