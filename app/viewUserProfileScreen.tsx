import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Post from '../components/post';
import { db } from '../Firebaseconfig';


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

type HeaderProps = {
  postCount: number;
  initials: string;
  displayName: string;
  onBack: () => void;
  following: boolean;
  updateFollowing: () => void;
};

const Header = ({ postCount, initials, displayName, onBack, following, updateFollowing }: HeaderProps) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.6}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>
    <View style={styles.avatarRow}>
      <View style={styles.centerSection}>
        <Avatar.Text size={90} label={initials} style={styles.avatar} color="#fff" />
        <Text style={styles.name}>{displayName}</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={{ color: '#000000', fontWeight: '600' }}>Snacks: {postCount}</Text>
        </View>
        <View>
          {displayName !== getAuth().currentUser?.displayName && (
            <TouchableOpacity onPress={updateFollowing} activeOpacity={0.7} style={{ marginTop: 8, backgroundColor: COLORS.accent, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{following ? 'Unfollow' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
    <View style={styles.tabRow}>
      <View style={[styles.tab, styles.tabActive]}>
        <Text style={[styles.tabText, styles.tabTextActive]}>Posts</Text>
      </View>
    </View>
  </View>
);

type ViewUserProfileScreenProps = {
  userEmail: string;
  onBack: () => void;
};

export default function ViewUserProfileScreen({ userEmail, onBack }: ViewUserProfileScreenProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser || !userEmail) return;

    const followingRef = doc(db, 'users', currentUser.uid, 'following', userEmail);
    const unsubscribe = onSnapshot(followingRef, (docSnap) => {
      setFollowing(docSnap.exists());
    });

    return unsubscribe;
  }, [userEmail, getAuth().currentUser?.uid]);

  const handleFollowToggle = async () => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const followingRef = doc(db, 'users', currentUser.uid, 'following', userEmail);
    if (following) {
      await deleteDoc(followingRef);
      setFollowing(false);
    } else {
      await setDoc(followingRef, {});
      setFollowing(true);
    }

  }

  useEffect(() => {
    if (!userEmail) return;
    const fetchPosts = async () => {
      const q = query(collection(db, 'posts'), where('author', '==', userEmail));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(fetched);
    };
    fetchPosts();
  }, [userEmail]);

  const username = userEmail ? userEmail.split('@')[0] : 'Unknown';
  const initials = username.slice(0, 2).toUpperCase();


  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      style={styles.list}
      ListHeaderComponent={
        <Header
          postCount={posts.length}
          initials={initials}
          displayName={username}
          onBack={onBack}
          following={following}
          updateFollowing={handleFollowToggle}
        />
      }
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
      renderItem={({ item }) => (
        <Post
          author={item.author ?? 'Unknown'}
          time={item.time?.toDate().toLocaleString() ?? ''}
          item={item.item}
          description={item.description}
          address={item.address}
          image={item.imageURL}
          postId={item.id}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: COLORS.background },
  listContent: { backgroundColor: COLORS.background, paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0, backgroundColor: COLORS.background },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 15, color: COLORS.accent, fontWeight: '600' },
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
});
