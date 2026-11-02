import AntDesign from '@expo/vector-icons/AntDesign';
import type { User } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Post from '../components/post';
import { getDisplayName, onAuthStateChanged, syncProfileFromUser } from '../lib/auth';
import { enrichPostsWithProfiles, formatPostTime, mapPost, type AppPost } from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

type HeaderProps = {
  tab: 'posts' | 'saves';
  onTabChange: (t: 'posts' | 'saves') => void;
  postCount: number;
  followingCount?: number;
  onGoToSettings?: () => void;
  onGoToFollowing?: () => void;
  initials: string;
  displayName: string;
  avatarUrl: string | null;
};

const Header = ({
  tab,
  onTabChange,
  postCount,
  followingCount = 0,
  onGoToSettings,
  onGoToFollowing,
  initials,
  displayName,
  avatarUrl,
}: HeaderProps) => {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity
          onPress={onGoToSettings}
          activeOpacity={0.7}
          style={styles.settingsBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AntDesign name="setting" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.identity}>
        {avatarUrl ? (
          <Avatar.Image size={88} source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Text size={88} label={initials} style={styles.avatar} color={COLORS.onAccent} />
        )}
        <Text style={styles.name}>{displayName}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statNum}>{postCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statBlock}
          onPress={onGoToFollowing}
          activeOpacity={0.7}
        >
          <Text style={styles.statNum}>{followingCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'posts' && styles.segmentBtnActive]}
          onPress={() => onTabChange('posts')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tab === 'posts' && styles.segmentTextActive]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'saves' && styles.segmentBtnActive]}
          onPress={() => onTabChange('saves')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tab === 'saves' && styles.segmentTextActive]}>
            Saves
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type ProfileScreenProps = {
  onGoToSettings?: () => void;
  onGoToFollowing?: () => void;
};

export default function ProfileScreen({ onGoToSettings, onGoToFollowing }: ProfileScreenProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [tab, setTab] = useState<'posts' | 'saves'>('posts');
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedPosts, setSavedPosts] = useState<AppPost[]>([]);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const data = tab === 'posts' ? posts : savedPosts;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((u) => setCurrentUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setAvatarUrl(null);
      return;
    }

    const fetchAvatar = async () => {
      await syncProfileFromUser(currentUser);
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();
      setAvatarUrl(profile?.avatar_url || currentUser.user_metadata?.avatar_url || null);
    };

    fetchAvatar();

    const channel = supabase
      .channel(`own-avatar-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${currentUser.id}`,
      }, () => fetchAvatar())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchOwnPosts = async () => {
      const { data: rows } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', currentUser.id);
      if (rows) setPosts(await enrichPostsWithProfiles(rows.map(mapPost)));
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
      if (rows) setSavedPosts(await enrichPostsWithProfiles(rows.map(mapPost)));
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
          .eq('followed_id', currentUser.id);
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
          avatarUrl={avatarUrl}
        />
      }
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {tab === 'posts' ? 'No posts yet' : 'No saved posts yet'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Post
          author={item.author ?? 'Unknown'}
          userId={item.user_id}
          avatarUrl={item.avatarUrl}
          time={formatPostTime(item.time)}
          item={item.item}
          description={item.description}
          address={item.address}
          image={item.imageURL}
          postId={item.id}
          reliabilityScore={item.reliabilityScore}
          inStockVotes={item.inStockVotes}
          soldOutVotes={item.soldOutVotes}
          myVote={item.myVote}
        />
      )}
    />
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  list: {
    backgroundColor: COLORS.background,
  },
  listContent: {
    backgroundColor: COLORS.background,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: COLORS.accent,
  },
  name: {
    fontWeight: '700',
    fontSize: 20,
    marginTop: 12,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    marginBottom: 18,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
  },
  statNum: {
    fontWeight: '800',
    fontSize: 18,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
