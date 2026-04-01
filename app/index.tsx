import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import * as React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
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
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Content
          title="Shelf Spot"
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action testID="add-post-button" icon="plus-circle-outline" onPress={onAddPost} />
      </Appbar.Header>

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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
});