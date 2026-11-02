import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProfileNav } from '../context/ProfileNavContext';
import { getCurrentUser } from '../lib/auth';
import type { StockVote } from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';
import ReliabilityVote from './reliabilityVote';

type PostCardProps = {
  author: string;
  userId: string;
  avatarUrl?: string | null;
  item: string;
  description: string;
  address: string;
  image: string;
  time: string;
  postId: string;
  reliabilityScore?: number | null;
  inStockVotes?: number;
  soldOutVotes?: number;
  myVote?: StockVote | null;
};

export default function PostCard({
  author,
  userId,
  avatarUrl = null,
  item,
  description,
  address,
  image,
  time,
  postId,
  reliabilityScore = null,
  inStockVotes = 0,
  soldOutVotes = 0,
  myVote = null,
}: PostCardProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [saved, setSaved] = useState(false);
  const { onViewProfile } = useProfileNav();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const checkSaved = async () => {
        const { data } = await supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle();
        setSaved(!!data);
      };

      await checkSaved();

      channel = supabase
        .channel(`saved-post-${user.id}-${postId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'saved_posts',
          filter: `user_id=eq.${user.id}`,
        }, () => checkSaved())
        .subscribe();
    };

    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [postId]);

  const handleSavePress = async () => {
    const user = await getCurrentUser();
    if (!user) return;
    const newSavedState = !saved;
    setSaved(newSavedState);
    try {
      if (newSavedState) {
        await savePost(user.id, postId);
      } else {
        await unsavePost(user.id, postId);
      }

      const { data } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      setSaved(!!data);
    } catch (err) {
      setSaved(!newSavedState);
      console.error('Error saving/unsaving post:', err);
    }
  };

  const initials = author
    ? author
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U';

  return (
    <View style={styles.card}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <AntDesign name="picture" size={28} color={COLORS.textSecondary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.authorRow}>
          <TouchableOpacity
            style={styles.authorPressable}
            onPress={() => onViewProfile(userId)}
            activeOpacity={0.6}
          >
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{author || 'Unknown'}</Text>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSavePress}
            style={styles.saveButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? COLORS.accent : COLORS.border}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemName}>{item}</Text>

        {description ? (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        ) : null}

        {address ? (
          <View style={styles.locationRow}>
            <AntDesign name="pushpin" size={11} color={COLORS.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{address}</Text>
          </View>
        ) : null}

        <ReliabilityVote
          postId={postId}
          reliabilityScore={reliabilityScore}
          inStockVotes={inStockVotes}
          soldOutVotes={soldOutVotes}
          myVote={myVote}
        />
      </View>
    </View>
  );
}

const savePost = async (userId: string, postId: string) => {
  await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId });
};

const unsavePost = async (userId: string, postId: string) => {
  await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId);
};

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 28,
    height: 28,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  saveButton: {
    padding: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
