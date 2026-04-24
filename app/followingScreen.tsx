import FollowingCard from '@/components/followingCard';
import { collection, getDocs } from 'firebase/firestore';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { auth, db } from '../Firebaseconfig';

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
  name: string;
  email: string;
}

export default function FollowingScreen({ onBack }: { onBack?: () => void }) {
  const [following, setFollowing] = React.useState<ProfileData[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchFollowing = async () => {
    setRefreshing(true);
    const uid = auth.currentUser?.uid;
    if (!uid) { setRefreshing(false); return; }

    const followingSnap = await getDocs(collection(db, 'users', uid, 'following'));

    const fetched = followingSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
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
          <FollowingCard key={profile.id} username={profile.id} />
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