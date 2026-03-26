import Post from '@/components/post';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { FlatList, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../Firebaseconfig';

interface PostData {
  id: string;
  author: string;
  description: string;
  imageURL: string;
  item: string;
  time: any;
}

export default function SearchScreen() {
  const scheme = useColorScheme();
  const textColor = scheme === 'dark' ? '#fff' : '#000';
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (search: string) => {
    setRefreshing(true);
    const q = search.trim()
      ? query(
        collection(db, 'posts'),
        where('item', '>=', search),
        where('item', '<=', search + '\uf8ff'),
        orderBy('item')
      )
      : query(collection(db, 'posts'), orderBy('time', 'desc'));

    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<PostData, 'id'>
    }));
    setPosts(fetched);
    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchPosts(searchQuery);
  }, [searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, marginHorizontal: 20 }}>
      <TextInput
        placeholder="Search"
        clearButtonMode="always"
        style={{
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderColor: '#ccc',
          borderWidth: 1,
          borderRadius: 8,
          color: textColor
        }}
        autoCapitalize="none"
        autoCorrect={false}
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => fetchPosts(searchQuery)}
        renderItem={({ item }) => (
          <Post
            title={item.author}
            subtitle={item.time?.toDate().toLocaleString() ?? ''}
            content={`${item.item} — ${item.description}`}
            image={item.imageURL}
          />
        )}
      />
    </SafeAreaView>
  );
}