import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Avatar } from 'react-native-paper';

const MOCK_POSTS = Array.from({ length: 9 }, (_, i) => ({ id: String(i) }));

const Header = () => (
  <View style={styles.header}>
    <View style={styles.avatarRow}>
      <Avatar.Text size={90} label="JD" style={styles.avatar} color="#fff" />
      <View style={styles.stats}>
        {[['12', 'Posts'], ['300', 'Followers'], ['180', 'Following']].map(([n, l]) => (
          <View key={l} style={styles.stat}>
            <Text style={styles.statNum}>{n}</Text>
            <Text style={styles.statLabel}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
    <Text style={styles.name}>John Doe</Text>
  </View>
);

export default function ProfileScreen() {
  return (
    <FlatList
      data={MOCK_POSTS}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={Header}
      renderItem={() => <View style={styles.postTile} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#fff', paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 14 },
  avatar: { backgroundColor: '#4a90d9' },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontWeight: 'bold', fontSize: 20 },
  statLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  name: { fontWeight: 'bold', fontSize: 16 },
  postTile: { marginHorizontal: 20, height: 220, backgroundColor: '#e0e0e0', borderRadius: 10, marginBottom: 12 },
});
