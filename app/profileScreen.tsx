import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';

const MOCK_POSTS = Array.from({ length: 9 }, (_, i) => ({ id: String(i) }));
const MOCK_SAVES = Array.from({ length: 4 }, (_, i) => ({ id: String(i) }));

const Header = ({ tab, onTabChange }: { tab: 'posts' | 'saves'; onTabChange: (t: 'posts' | 'saves') => void }) => (
  <View style={styles.header}>
    <View style={styles.avatarRow}>
      <Avatar.Text size={90} label="JD" style={styles.avatar} color="#fff" />
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>12</Text>
          <Text style={styles.statLabel}>Saves</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>300</Text>
          <Text style={styles.statLabel}>Taste Buds</Text>
        </View>
      </View>
    </View>
    <Text style={styles.name}>John Doe</Text>
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tab, tab === 'posts' && styles.tabActive]}
        onPress={() => onTabChange('posts')}
      >
        <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, tab === 'saves' && styles.tabActive]}
        onPress={() => onTabChange('saves')}
      >
        <Text style={[styles.tabText, tab === 'saves' && styles.tabTextActive]}>Saves</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function ProfileScreen() {
  const [tab, setTab] = useState<'posts' | 'saves'>('posts');
  const data = tab === 'posts' ? MOCK_POSTS : MOCK_SAVES;

  return (
    <FlatList
      key={tab}
      data={data}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Header tab={tab} onTabChange={setTab} />}
      renderItem={() => <View style={styles.postTile} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#fff', paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 0 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 14 },
  avatar: { backgroundColor: '#4a90d9' },
  stats: { flexDirection: 'row', gap: 24, marginLeft: 8 },
  stat: { alignItems: 'center' },
  statNum: { fontWeight: 'bold', fontSize: 20 },
  statLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 16 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#4a90d9' },
  tabText: { fontSize: 14, color: '#888' },
  tabTextActive: { color: '#4a90d9', fontWeight: 'bold' },
  postTile: { marginHorizontal: 20, height: 220, backgroundColor: '#e0e0e0', borderRadius: 10, marginBottom: 12, marginTop: 12 },
});
