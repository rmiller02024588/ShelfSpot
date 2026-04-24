import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getCountFromServer, getDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Post from '../components/post';
import { auth, db } from '../Firebaseconfig';

const COLORS = {
  background:    '#FAF7F2',
  card:          '#FFFFFF',
  accent:        '#C0784A',
  accentLight:   '#F5EDE4',
  text:          '#2C1A0E',
  textSecondary: '#8C7B6E',
  border:        '#E8DDD4',
  inputBg:       '#FDF9F5',
};

type HeaderProps = {
  tab: 'posts' | 'saves';
  onTabChange: (t: 'posts' | 'saves') => void;
  postCount: number;
  followingCount?: number;
  onGoToSettings?: () => void;
  onGoToFollowing?: () => void;
  initials: string;
  displayName: string;
};

const Header = ({ tab, onTabChange, postCount, followingCount, onGoToSettings, onGoToFollowing, initials, displayName }: HeaderProps) => (
  <View style={styles.header}>
    <View style={styles.avatarRow}>
      <View style={styles.centerSection}>
        <Avatar.Text size={90} label={initials} style={styles.avatar} color="#fff" />
        <Text style={styles.name}>{displayName}</Text>
      </View>
      <View style={styles.stats}>
        <TouchableOpacity style={styles.stat} activeOpacity={0.6}>
          <Text style={{ color: '#000000', fontWeight: '600' }}>Snacks: {postCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onGoToFollowing} activeOpacity={0.7} style={{ marginTop: 8, backgroundColor: COLORS.accent, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Taste Buds: {followingCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onGoToSettings} activeOpacity={0.7} style={{ marginTop: 8, backgroundColor: COLORS.accent, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tab, tab === 'posts' && styles.tabActive]}
        onPress={() => onTabChange('posts')}
      >
        <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, tab === 'saves' && styles.tabActive]}
        onPress={() => onTabChange('saves')}
      >
        <Text style={[styles.tabText, tab === 'saves' && styles.tabTextActive]}>Saves</Text>
      </TouchableOpacity>
    </View>
  </View>
);

type ProfileScreenProps = { onGoToSettings?: () => void  
  onGoToFollowing?: () => void };

export default function ProfileScreen({ onGoToSettings, onGoToFollowing }: ProfileScreenProps) {
  const [tab, setTab] = useState<'posts' | 'saves'>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const data = tab === 'posts' ? posts : savedPosts;
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return unsubscribe;
  }, []);

  // Fetch user's own posts from ownPosts subcollection
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = collection(db, 'users', currentUser.uid, 'ownPosts');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(fetched);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  // Fetch user's saved posts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = collection(db, 'users', currentUser.uid, 'savedPosts');

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched = await Promise.all(
        snapshot.docs.map(async (savedDoc) => {
          const postDoc = await getDoc(doc(db, 'posts', savedDoc.id));
          return { id: postDoc.id, ...postDoc.data() };
        })
      );

      setSavedPosts(fetched);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setFollowingCount(0);
      return;
    }

    getCountFromServer(collection(db, 'users', currentUser.uid, 'following'))
      .then((snap) => setFollowingCount(snap.data().count))
      .catch(() => setFollowingCount(0));
  }, [currentUser?.uid]);

  const username = currentUser?.displayName
  || currentUser?.email?.split('@')[0]
  || 'Unknown';
  const initials = username.slice(0, 2).toUpperCase();
  const insets = useSafeAreaInsets();

  return (
    <FlatList
      key={tab}
      data={data}
      keyExtractor={(item) => item.id}
      style={styles.list}
      ListHeaderComponent={
        <Header
          tab={tab}
          onTabChange={setTab}
          postCount={posts.length}
          followingCount={followingCount}
          onGoToSettings={onGoToSettings}
          onGoToFollowing={onGoToFollowing}
          initials={initials}
          displayName={username}
        />
      }
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
      renderItem={({ item }) => (
        tab === 'posts' ? (
          <Post
            author={item.author ?? 'Unknown'}
            time={item.time?.toDate().toLocaleString() ?? ''}
            item={item.item}
            description={item.description}
            address={item.address}
            image={item.imageURL}
            postId={item.id}
          />
        ) : (
          <Post
            author={item.author ?? 'Unknown'}
            time={item.time?.toDate().toLocaleString() ?? ''}
            item={item.item}
            description={item.description}
            address={item.address}
            image={item.imageURL}
            postId={item.id}
          />
        )
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: COLORS.background },
  listContent: { backgroundColor: COLORS.background, paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0, backgroundColor: COLORS.background },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 14 },
  centerSection: { alignItems: 'center', flex: 0 },
  avatar: { backgroundColor: COLORS.accent },
  stats: { flexDirection: 'column', gap: 8, justifyContent: 'flex-start', alignItems: 'flex-end' },
  stat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  statNum: { fontWeight: 'bold', fontSize: 16, color: COLORS.text, marginLeft: 4 },
  statLabel: { fontSize: 13, color: COLORS.textSecondary },
  name: { fontWeight: 'bold', fontSize: 16, marginTop: 8, color: COLORS.text },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginTop: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.accent, fontWeight: 'bold' },
  postTile: { marginHorizontal: 20, height: 220, backgroundColor: COLORS.accentLight, borderRadius: 12, marginBottom: 12, marginTop: 12 },
});
