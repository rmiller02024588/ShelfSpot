import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Post from '../components/post';
import { getCurrentUser, getDisplayName } from '../lib/auth';
import { formatPostTime, mapPost, type AppPost } from '../lib/posts';
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

type HeaderProps = {
  postCount: number;
  followingCount: number;
  initials: string;
  displayName: string;
  onBack: () => void;
  following: boolean;
  updateFollowing: () => void;
  currentDisplayName: string;
};

const Header = ({ postCount, followingCount, initials, displayName, onBack, following, updateFollowing, currentDisplayName }: HeaderProps) => (
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
        <View style={styles.stat}>
          <Text style={{ color: '#000000', fontWeight: '600' }}>Taste Buds: {followingCount}</Text>
        </View>
        <View style={styles.stat}>
          {displayName !== currentDisplayName && (
            <TouchableOpacity onPress={updateFollowing} activeOpacity={0.7} style={{ marginTop: 8, backgroundColor: COLORS.accent, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{following ? 'Unfollow' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
          </View>
      </View>
    </View>
  </View>
);

type ViewUserProfileScreenProps = {
  userId: string;
  onBack: () => void;
};

export default function ViewUserProfileScreen({ userId, onBack }: ViewUserProfileScreenProps) {
  const [posts, setPosts] = useState<AppPost[]>([]);
  const insets = useSafeAreaInsets();
  const [following, setFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentDisplayName, setCurrentDisplayName] = useState('');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setTargetUserId(profile.id);
        setProfileDisplayName(profile.display_name || profile.email.split('@')[0]);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !targetUserId) return;

      setCurrentDisplayName(getDisplayName(currentUser));

      const { count } = await supabase
        .from('following')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id);
      setFollowingCount(count ?? 0);

      const { data } = await supabase
        .from('following')
        .select('followed_id')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', targetUserId)
        .maybeSingle();
      setFollowing(!!data);

      channel = supabase
        .channel(`following-${currentUser.id}-${targetUserId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'following',
          filter: `follower_id=eq.${currentUser.id}`,
        }, async () => {
          const { data: row } = await supabase
            .from('following')
            .select('followed_id')
            .eq('follower_id', currentUser.id)
            .eq('followed_id', targetUserId)
            .maybeSingle();
          setFollowing(!!row);
        })
        .subscribe();
    };

    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || !targetUserId) return;

    if (following) {
      await supabase
        .from('following')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('followed_id', targetUserId);
      setFollowing(false);
    } else {
      await supabase.from('following').insert({
        follower_id: currentUser.id,
        followed_id: targetUserId,
      });
      setFollowing(true);
    }
  };

  useEffect(() => {
    if (!targetUserId) return;

    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('user_id', targetUserId);
      if (data) setPosts(data.map(mapPost));
    };
    fetchPosts();
  }, [targetUserId]);

  const initials = profileDisplayName.slice(0, 2).toUpperCase();


  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      style={styles.list}
      ListHeaderComponent={
        <Header
          postCount={posts.length}
          followingCount={followingCount}
          initials={initials}
          displayName={profileDisplayName}
          onBack={onBack}
          following={following}
          updateFollowing={handleFollowToggle}
          currentDisplayName={currentDisplayName}
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
