import MinPostCard from '@/components/minPost';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import type { User } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Appbar } from 'react-native-paper';
import StoreMarker from '../components/storeMarker';
import { onAuthStateChanged } from '../lib/auth';
import { enrichPostsWithProfiles, formatPostTime, mapPost, type AppPost } from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';


type Post = AppPost;
type StoreGroup = {
    address: string;
    posts: Post[];
    coordinates: { latitude: number; longitude: number };
};

const defaultAddress: Location.LocationGeocodedAddress = {
    street: '220 pawtucket st',
    city: 'lowell',
    region: 'ma',
    country: 'usa',
    district: null,
    streetNumber: '220',
    subregion: null,
    postalCode: '01854',
    name: 'Ucrossing',
    isoCountryCode: null,
    timezone: null,
    formattedAddress: null
};
const defaultLatitude: number = 42.6500221;
const defaultLongitude: number = -71.3241605;
const locationRange: number = 20 * 1609.34; // 32187.5; // 20 miles in meters

export async function getUserLocation(): Promise<[number | null, number | null, Location.LocationGeocodedAddress | null]> {
    const {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return [defaultLatitude, defaultLongitude, defaultAddress];
    }

    let local = await Location.getCurrentPositionAsync({});
    const {latitude, longitude} = local.coords;

    const reverseGeocode = await Location.reverseGeocodeAsync({latitude, longitude});
    if (reverseGeocode && reverseGeocode.length > 0) {
        return [latitude, longitude, reverseGeocode[0]];
    }
    return [latitude, longitude, null];
}

function hasValidCoordinates(coordinates: Post['coordinates'] | null | undefined) {
    return (
        !!coordinates &&
        Number.isFinite(coordinates.latitude) &&
        Number.isFinite(coordinates.longitude)
    );
}

function groupPostsByStore(posts: Post[]): StoreGroup[] {
    const map: Record<string, StoreGroup> = {};

    posts.forEach(post => {
        if (!hasValidCoordinates(post.coordinates)) return;

        const key = post.address || `${post.coordinates.latitude},${post.coordinates.longitude}`;

        if (!map[key]) {
            map[key] = { address: key, posts: [], coordinates: post.coordinates };
        }
        map[key].posts.push(post);
    });

    return Object.values(map);
}



export default function MapScreen() {
    const COLORS = useThemeColors();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedStore, setSelectedStore] = useState<StoreGroup | null>(null);
    const [posts, setPosts] = useState<AppPost[]>([]);
    const [location, setLocation] = useState<[number, number]>([defaultLatitude, defaultLongitude]);
    const [tracksViewChanges, setTracksViewChanges] = useState(true);
    const [recentering, setRecentering] = useState(false);
    const mapRef = useRef<MapView>(null);

    const recenterOnUser = async () => {
        if (recentering) return;
        setRecentering(true);
        try {
            const [lat, lon] = await getUserLocation();
            const nextLat = lat ?? defaultLatitude;
            const nextLon = lon ?? defaultLongitude;
            setLocation([nextLat, nextLon]);
            mapRef.current?.animateToRegion?.({
                latitude: nextLat,
                longitude: nextLon,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        } finally {
            setRecentering(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged((u) => setCurrentUser(u));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data } = await supabase.from('posts').select('*');
            if (data) setPosts(await enrichPostsWithProfiles(data.map(mapPost)));
        };

        fetchPosts();

        const channel = supabase
            .channel('map-posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        const fetchLocation = async () => {
            const [lat, lon] = await getUserLocation();
            const nextLat = lat ?? defaultLatitude;
            const nextLon = lon ?? defaultLongitude;
            setLocation([nextLat, nextLon]);
            mapRef.current?.animateToRegion?.({
                latitude: nextLat,
                longitude: nextLon,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        };
        fetchLocation();
    }, []);

    // Custom markers need one paint pass before freezing the bitmap, or taps miss the icon.
    useEffect(() => {
        setTracksViewChanges(true);
        const timer = setTimeout(() => setTracksViewChanges(false), 750);
        return () => clearTimeout(timer);
    }, [posts]);

    const sortedPosts = [...posts].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    const groupedStores = groupPostsByStore(sortedPosts);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Content title="Map" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          initialRegion={{
            latitude: location[0],
            longitude: location[1],
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {groupedStores.map((store) => (
            <Marker
              key={store.address}
              coordinate={{
                latitude: store.coordinates.latitude,
                longitude: store.coordinates.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={tracksViewChanges}
              stopPropagation
              tappable
              onPress={(event) => {
                event.stopPropagation?.();
                setSelectedStore(store);
              }}
            >
              <StoreMarker count={store.posts.length} />
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity
          style={styles.recenterButton}
          onPress={recenterOnUser}
          activeOpacity={0.85}
          accessibilityLabel="Recenter map on my location"
          disabled={recentering}
        >
          <MaterialIcons name="my-location" size={22} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={!!selectedStore}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedStore(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedStore(null)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {selectedStore?.address}
            </Text>

            <FlatList
              data={selectedStore?.posts ?? []}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <MinPostCard
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

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedStore(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  container: {
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
  mapWrap: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  modalList: {
    flexGrow: 0,
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: COLORS.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
});
