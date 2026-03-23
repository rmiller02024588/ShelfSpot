import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import * as React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Appbar, Badge } from 'react-native-paper';
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

export default function HomeScreen() {
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('time', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<PostData, 'id'>
      }));
      setPosts(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <View style={{ justifyContent: 'center', marginRight: 10, marginLeft: 10 }}>
          <Badge>{posts.length}</Badge>
        </View>
        <Appbar.Content title="Shelf Spot" />
        <Appbar.Action testID="add-post-button" icon="plus-circle-outline" onPress={() => {}} />
      </Appbar.Header>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Post
              title={item.author}
              subtitle={item.time?.toDate().toLocaleString() ?? ''}
              content={`${item.item} — ${item.description}`}
              image={item.imageURL}
            />
          )}
        />
      )}
    </View>
  );
}