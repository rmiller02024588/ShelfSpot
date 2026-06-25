import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Post from '../components/post';
import { getDisplayName, onAuthStateChanged } from '../lib/auth';
import { formatPostTime, mapPost, type AppPost } from '../lib/posts';
import { supabase } from '../Supabaseconfig';

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
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedPosts, setSavedPosts] = useState<AppPost[]>([]);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const data = tab === 'posts' ? posts : savedPosts;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((u) => setCurrentUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchOwnPosts = async () => {
      const { data: rows } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', currentUser.id);
      if (rows) setPosts(rows.map(mapPost));
    };

    fetchOwnPosts();

    const channel = supabase
      .channel(`own-posts-${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `user_id=eq.${currentUser.id}`,
      }, () => fetchOwnPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchSavedPosts = async () => {
      const { data: saved } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', currentUser.id);

      const postIds = (saved ?? []).map(s => s.post_id);
      if (postIds.length === 0) {
        setSavedPosts([]);
        return;
      }

      const { data: rows } = await supabase.from('posts').select('*').in('id', postIds);
      if (rows) setSavedPosts(rows.map(mapPost));
    };

    fetchSavedPosts();

    const channel = supabase
      .channel(`saved-posts-${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'saved_posts',
        filter: `user_id=eq.${currentUser.id}`,
      }, () => fetchSavedPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setFollowingCount(0);
      return;
    }

    const fetchFollowingCount = async () => {
      try {
        const { count } = await supabase
          .from('following')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', currentUser.id);
        setFollowingCount(count ?? 0);
      } catch {
        setFollowingCount(0);
      }
    };

    fetchFollowingCount();
  }, [currentUser?.id]);

  const username = getDisplayName(currentUser);
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
        <Post
          author={item.author ?? 'Unknown'}
          userId={item.user_id}
          time={formatPostTime(item.time)}
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
