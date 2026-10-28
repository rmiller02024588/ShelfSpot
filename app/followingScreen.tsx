import FollowingCard from '@/components/followingCard';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { supabase } from '../Supabaseconfig';

const COLORS = {
  background: '#FAF7F2',
  card: '#FFFFFF',
  accent: '#C0784A',
  accentLight: '#F5EDE4',
  text: '#2C1A0E',
  textSecondary: '#8C7B6E',
  border: '#E8DDD4',
  inputBg: '#FDF9F5',
};

interface ProfileData {
  id: string;
  email: string;
  displayName: string;
}

export default function FollowingScreen({ onBack }: { onBack?: () => void }) {
  const [following, setFollowing] = React.useState<ProfileData[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchFollowing = async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRefreshing(false); return; }

    const { data: follows } = await supabase
      .from('following')
      .select('followed_id')
      .eq('follower_id', user.id);

    const followedIds = (follows ?? []).map(row => row.followed_id as string);
    if (followedIds.length === 0) {
      setFollowing([]);
      setRefreshing(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', followedIds);

    const fetched = (profiles ?? []).map(profile => ({
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name || profile.email.split('@')[0],
    }));

    setFollowing(fetched);
    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchFollowing();
  }, []);

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Taste Buds" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchFollowing} colors={[COLORS.accent]} />
        }
      >
        {following.map(profile => (
          <FollowingCard
            key={profile.id}
            userId={profile.id}
            displayName={profile.displayName}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 0 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  container: { padding: 20, backgroundColor: COLORS.background, flexGrow: 1 },
});
