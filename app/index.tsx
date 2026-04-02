import AntDesign from '@expo/vector-icons/AntDesign';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { Appbar } from 'react-native-paper';
import { db } from '../Firebaseconfig';
import Post from '../components/post';

interface PostData {
  id: string;
  author: string;
  description: string;
  imageURL: string;
  item: string;
  time: any;
  address: string;
}

type HomeScreenProps = {
  onAddPost: () => void;
};

const CATEGORIES = [
  { label: 'Snack', value: '1' },
  { label: 'Drink', value: '2' },
];

const COLORS = {
  background: '#F2F2F2',
  card: '#FFFFFF',
  accent: '#1A1A1A',
  accentLight: '#F0F0F0',
  text: '#1A1A1A',
  textSecondary: '#8A8A8A',
  border: '#E0E0E0',
  inputBg: '#FAFAFA',
};

export default function HomeScreen({ onAddPost }: HomeScreenProps) {
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchPosts = async () => {
    setRefreshing(true);

    let q;
    if (selected.length > 0) {
      q = query(
        collection(db, 'posts'),
        where('type', 'array-contains-any', selected),
        orderBy('time', 'desc')
      );
    } else {
      q = query(collection(db, 'posts'), orderBy('time', 'desc'));
    }

    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<PostData, 'id'>
    }));
    setPosts(fetched);
    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchPosts();
  }, [selected]);

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
        />
      </Appbar.Header>

      <View style={styles.filterBar}>
        <AntDesign name="tag" size={15} color={COLORS.textSecondary} style={styles.filterIcon} />
        <Text style={styles.filterLabel}>Filter:</Text>
        <MultiSelect
          renderSelectedItem={(item, unSelect) => (
            <TouchableOpacity onPress={() => unSelect && unSelect(item)} style={styles.selectedChip}>
              <Text style={styles.selectedChipText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          inputSearchStyle={styles.dropdownSearch}
          iconStyle={styles.dropdownIcon}
          containerStyle={styles.dropdownContainer}
          activeColor={COLORS.accentLight}
          search
          data={CATEGORIES}
          labelField="label"
          valueField="value"
          placeholder="All categories"
          searchPlaceholder="Search…"
          value={selected}
          onChange={item => setSelected(item)}
          selectedStyle={styles.selectedChip}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={fetchPosts}
        renderItem={({ item }) => (
          <Post
            author={item.author}
            time={item.time?.toDate().toLocaleString() ?? ''}
            item={item.item}
            description={item.description}
            address={item.address}
            image={item.imageURL}
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
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.4,
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
  dropdown: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownSearch: {
    height: 40,
    fontSize: 14,
    color: COLORS.text,
    borderColor: COLORS.border,
  },
  dropdownIcon: {
    width: 18,
    height: 18,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderColor: COLORS.border,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedChip: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginVertical: 3,
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});