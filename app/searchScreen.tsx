import MinPostCard from '@/components/minPost';
import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Appbar } from 'react-native-paper';
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

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (search: string) => {
    setRefreshing(true);
    const trimmed = search.trim();

    if (trimmed) {
      const [byItem, byAuthor] = await Promise.all([
        supabase.from('posts').select('*').ilike('item', `${trimmed}%`).order('item'),
        supabase.from('posts').select('*').ilike('author', `${trimmed}%`).order('author'),
      ]);
      const combined = [
        ...(byItem.data ?? []).map(mapPost),
        ...(byAuthor.data ?? []).map(mapPost),
      ];
      const unique = combined.filter((post, index, self) => self.findIndex(p => p.id === post.id) === index);
      setPosts(unique);
    } else {
      const { data } = await supabase.from('posts').select('*').order('time', { ascending: false });
      setPosts((data ?? []).map(mapPost));
    }

    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchPosts(searchQuery);
  }, [searchQuery]);

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
            placeholder="Search for a snack or drink..."
            placeholderTextColor={COLORS.textSecondary}
            clearButtonMode="always"
            autoCorrect={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => fetchPosts(searchQuery)}
        renderItem={({ item }) => (
          <MinPostCard
            author={item.author}
            time={formatPostTime(item.time)}
            item={item.item}
            description={item.description}
            address={item.address}
            image={item.imageURL}
            postId={item.id}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
