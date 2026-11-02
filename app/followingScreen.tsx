import FollowingCard from '@/components/followingCard';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export default function FollowingScreen({ onBack }: { onBack?: () => void }) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [followers, setFollowers] = React.useState<ProfileData[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchFollowers = async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRefreshing(false); return; }

    const { data: follows } = await supabase
      .from('following')
      .select('follower_id')
      .eq('followed_id', user.id);

    const followerIds = (follows ?? []).map(row => row.follower_id as string);
    if (followerIds.length === 0) {
      setFollowers([]);
      setRefreshing(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url')
      .in('id', followerIds);

    const fetched = (profiles ?? []).map(profile => ({
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name || profile.email.split('@')[0],
      avatarUrl: profile.avatar_url || null,
    }));

    setFollowers(fetched);
    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchFollowers();
  }, []);

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Followers" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchFollowers} colors={[COLORS.accent]} />
        }
      >
        {followers.length === 0 && !refreshing ? (
          <Text style={styles.emptyText}>No followers yet</Text>
        ) : (
          followers.map(profile => (
            <FollowingCard
              key={profile.id}
              userId={profile.id}
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 0 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  container: { padding: 20, backgroundColor: COLORS.background, flexGrow: 1 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});
