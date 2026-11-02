import AntDesign from '@expo/vector-icons/AntDesign';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Post from '../components/post';
import { getCurrentUser } from '../lib/auth';
import { enrichPostsWithProfiles, formatPostTime, mapPost, type AppPost } from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

type HeaderProps = {
  postCount: number;
  followingCount: number;
  initials: string;
  displayName: string;
  avatarUrl: string | null;
  onBack: () => void;
  showFollow: boolean;
  following: boolean;
  onFollowToggle: () => void;
};

const Header = ({
  postCount,
  followingCount,
  initials,
  displayName,
  avatarUrl,
  onBack,
  showFollow,
  following,
  onFollowToggle,
}: HeaderProps) => {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AntDesign name="left" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Profile</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.identity}>
        {avatarUrl ? (
          <Avatar.Image size={88} source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Text size={88} label={initials} style={styles.avatar} color={COLORS.onAccent} />
        )}
        <Text style={styles.name}>{displayName}</Text>

        {showFollow ? (
          <TouchableOpacity
            onPress={onFollowToggle}
            activeOpacity={0.8}
            style={[styles.followBtn, following && styles.followBtnActive]}
          >
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statNum}>{postCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statNum}>{followingCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>Posts</Text>
      </View>
    </View>
  );
};

type ViewUserProfileScreenProps = {
  userId: string;
  onBack: () => void;
};

export default function ViewUserProfileScreen({ userId, onBack }: ViewUserProfileScreenProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [posts, setPosts] = useState<AppPost[]>([]);
  const insets = useSafeAreaInsets();
  const [following, setFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setTargetUserId(profile.id);
        setProfileDisplayName(profile.display_name || profile.email.split('@')[0]);
        setAvatarUrl(profile.avatar_url || null);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser || !targetUserId) return;

      setCurrentUserId(currentUser.id);

      const { count } = await supabase
        .from('following')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', targetUserId);
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
      setFollowingCount((count) => Math.max(0, count - 1));
    } else {
      await supabase.from('following').insert({
        follower_id: currentUser.id,
        followed_id: targetUserId,
      });
      setFollowing(true);
      setFollowingCount((count) => count + 1);
    }
  };

  useEffect(() => {
    if (!targetUserId) return;

    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('user_id', targetUserId);
      if (data) setPosts(await enrichPostsWithProfiles(data.map(mapPost)));
    };
    fetchPosts();
  }, [targetUserId]);

  const initials = (profileDisplayName || '??').slice(0, 2).toUpperCase();
  const showFollow = !!currentUserId && !!targetUserId && currentUserId !== targetUserId;

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
          displayName={profileDisplayName || 'Unknown'}
          avatarUrl={avatarUrl}
          onBack={onBack}
          showFollow={showFollow}
          following={following}
          onFollowToggle={handleFollowToggle}
        />
      }
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No posts yet</Text>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: {
    width: 40,
    height: 40,
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
  followBtn: {
    marginTop: 14,
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  followBtnActive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followBtnText: {
    color: COLORS.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  followBtnTextActive: {
    color: COLORS.text,
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
  sectionLabelRow: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
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
