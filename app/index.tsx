import AntDesign from '@expo/vector-icons/AntDesign';
import * as Location from 'expo-location';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import Post from '../components/post';
import { CATEGORIES } from '../lib/categories';
import {
  boundingBox,
  enrichPostsWithProfiles,
  filterPostsWithinMiles,
  formatPostTime,
  mapPost,
  type AppPost,
} from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

type HomeScreenProps = {
  onAddPost: () => void;
};

const PAGE_SIZE = 10;
const MAX_DISTANCE_MILES = 25;
const DEFAULT_LATITUDE = 42.6500221;
const DEFAULT_LONGITUDE = -71.3241605;

async function getUserCoordinates(): Promise<{ latitude: number; longitude: number }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE };
    }
    const position = await Location.getCurrentPositionAsync({});
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return { latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE };
  }
}

export default function HomeScreen({ onAddPost }: HomeScreenProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [nearbyPosts, setNearbyPosts] = React.useState<AppPost[]>([]);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const loadingMoreLock = useRef(false);

  const visiblePosts = nearbyPosts.slice(0, visibleCount);
  const hasMore = visibleCount < nearbyPosts.length;

  const fetchPosts = useCallback(async () => {
    setRefreshing(true);
    setVisibleCount(PAGE_SIZE);

    const { latitude, longitude } = await getUserCoordinates();
    const box = boundingBox(latitude, longitude, MAX_DISTANCE_MILES);

    let query = supabase
      .from('posts')
      .select('*')
      .gte('latitude', box.minLat)
      .lte('latitude', box.maxLat)
      .gte('longitude', box.minLon)
      .lte('longitude', box.maxLon)
      .order('time', { ascending: false });

    if (selected.length > 0) {
      query = query.in('type', selected);
    }

    const { data, error } = await query;
    if (!error && data) {
      const mapped = await enrichPostsWithProfiles(data.map(mapPost));
      setNearbyPosts(filterPostsWithinMiles(mapped, latitude, longitude, MAX_DISTANCE_MILES));
    } else {
      setNearbyPosts([]);
    }

    setRefreshing(false);
  }, [selected]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = () => {
    if (refreshing || loadingMoreLock.current || !hasMore) return;

    loadingMoreLock.current = true;
    setLoadingMore(true);
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, nearbyPosts.length));
    setLoadingMore(false);
    loadingMoreLock.current = false;
  };

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Content
          title="Shelf Spot"
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action
          testID="add-post-button"
          icon="plus-circle-outline"
          onPress={onAddPost}
          iconColor={COLORS.accent}
        />
      </Appbar.Header>

      <View style={styles.filterBar}>
        <AntDesign name="tag" size={15} color={COLORS.textSecondary} style={styles.filterIcon} />
        <Text style={styles.filterLabel}>Filter:</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.filterChip, selected.length === 0 && styles.filterChipSelected]}
            onPress={() => setSelected([])}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, selected.length === 0 && styles.filterChipTextSelected]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((category) => {
            const isSelected = selected.includes(category.value);
            return (
              <TouchableOpacity
                key={category.value}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => {
                  setSelected((prev) =>
                    prev.includes(category.value)
                      ? prev.filter((value) => value !== category.value)
                      : [...prev, category.value]
                  );
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={fetchPosts}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts within 25 miles</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          ) : !hasMore && nearbyPosts.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>You're all caught up</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Post
            author={item.author}
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
    </View>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterIcon: {
    marginTop: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  chipRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: COLORS.onAccent,
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
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
