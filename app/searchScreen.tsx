import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import Post from '../components/post';
import { enrichPostsWithProfiles, formatPostTime, mapPost, type AppPost } from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

const PAGE_SIZE = 10;

export default function SearchScreen() {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedPosts, setMatchedPosts] = useState<AppPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const loadingMoreLock = useRef(false);
  const requestId = useRef(0);

  const visiblePosts = matchedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < matchedPosts.length;

  const fetchPosts = useCallback(async (search: string) => {
    const trimmed = search.trim();
    const keywords = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

    if (keywords.length === 0) {
      requestId.current += 1;
      setMatchedPosts([]);
      setVisibleCount(PAGE_SIZE);
      setHasSearched(false);
      setRefreshing(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setRefreshing(true);
    setHasSearched(true);
    setVisibleCount(PAGE_SIZE);

    const { data } = await supabase.from('posts').select('*').order('time', { ascending: false });
    if (currentRequest !== requestId.current) return;

    const mapped = await enrichPostsWithProfiles((data ?? []).map(mapPost));
    if (currentRequest !== requestId.current) return;

    setMatchedPosts(
      mapped.filter((post) => {
        const haystack = [post.item, post.description, post.author, post.address, post.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return keywords.every((keyword) => haystack.includes(keyword));
      })
    );
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPosts(searchQuery);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery, fetchPosts]);

  const loadMore = () => {
    if (refreshing || loadingMoreLock.current || !hasMore) return;

    loadingMoreLock.current = true;
    setLoadingMore(true);
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, matchedPosts.length));
    setLoadingMore(false);
    loadingMoreLock.current = false;
  };

  const emptyMessage = !hasSearched
    ? 'Search for cards, stores, or people'
    : 'No posts match your search';

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Content title="Search" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <AntDesign name="search" size={16} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by keywords..."
            placeholderTextColor={COLORS.textSecondary}
            clearButtonMode="always"
            autoCorrect={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => fetchPosts(searchQuery)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={visiblePosts.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          ) : hasSearched && !hasMore && matchedPosts.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Showing {matchedPosts.length} result{matchedPosts.length === 1 ? '' : 's'}
              </Text>
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
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
