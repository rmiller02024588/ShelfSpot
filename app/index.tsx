import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import * as React from 'react';
import { FlatList, View } from 'react-native';
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
}

type HomeScreenProps = {
  onAddPost: () => void;
};

export default function HomeScreen({ onAddPost }: HomeScreenProps) {
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchPosts = async () => {
    setRefreshing(true);
    const q = query(collection(db, 'posts'), orderBy('time', 'desc'));
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
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title="Shelf Spot" />
        <Appbar.Action testID="add-post-button" icon="plus-circle-outline" onPress={onAddPost} />
      </Appbar.Header>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={fetchPosts}
        renderItem={({ item }) => (
          <Post
            title={item.author}
            subtitle={item.time?.toDate().toLocaleString() ?? ''}
            content={`${item.item} — ${item.description}`}
            image={item.imageURL}
          />
        )}
      />
    </View>
  );
}