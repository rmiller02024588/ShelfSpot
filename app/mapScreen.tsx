import * as Location from 'expo-location';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import StoreMarker from '../components/storeMarker';
import { onAuthStateChanged } from '../lib/auth';
import { mapPost, type AppPost } from '../lib/posts';
import { supabase } from '../Supabaseconfig';


type Post = AppPost;
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

function groupPostsByStore(posts: Post[]) {
    const map: Record<string, {posts: Post[], coordinates: any}> = {};

    posts.forEach(post => {
        const key = post.address;

        if (!map[key]) {
            map[key] = { posts: [], coordinates: post.coordinates };
        }
        map[key].posts.push(post);
    });

    return Object.entries(map).map(([address, data])=> ({
        address,
        posts: data.posts,
        coordinates: data.coordinates
    }));
}



export default function MapScreen() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedStore, setSelectedStore] = useState<any | null>(null);
    const [posts, setPosts] = useState<AppPost[]>([]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged((u) => setCurrentUser(u));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data } = await supabase.from('posts').select('*');
            if (data) setPosts(data.map(mapPost));
        };

        fetchPosts();

        const channel = supabase
            .channel('map-posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);


    const [location, setLocation] = useState<[number, number]>([defaultLatitude, defaultLongitude]);

    useEffect(() => {
        const fetchLocation = async () => {
            const [lat, lon] = await getUserLocation();
                if (lat === null || lon === null) {
                     setLocation([defaultLatitude, defaultLongitude]);
                } else {
                    setLocation([lat, lon]);
                }
        };
        fetchLocation();
    }, []);

    posts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const groupedStores = groupPostsByStore(posts);


  return (
    <View style={styles.container}>
        <MapView
        style={styles.map}
        showsUserLocation={true}
        region={{
            latitude: location[0],
            longitude: location[1],
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }}>
            <Circle
            center={{ latitude: location[0], longitude: location[1] }}
            radius={locationRange}
            strokeColor="rgba(0, 0, 255, 0.5)"
            fillColor="rgba(0, 0, 255, 0.1)"
            />
            {groupedStores.map((store) => (
                <Marker
                    key={store.address}
                    coordinate={{
                        latitude: store.coordinates.latitude,
                        longitude: store.coordinates.longitude
                    }}
                
                    onPress={() => setSelectedStore(store)}
                >
                    <StoreMarker count={store.posts.length} />
                </Marker>
            ))}
        </MapView>
        <Modal visible={!!selectedStore} animationType="slide" transparent>
            <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.3)'
            }}>
                <View style={{
                backgroundColor: 'white',
                padding: 20,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '50%'
                }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                        {selectedStore?.address}
                    </Text>

                    <FlatList
                    data={selectedStore?.posts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={{ marginVertical: 8 }}>
                            <Text>{item.item}</Text>
                            <Text>{item.description}</Text>
                        </View>
                    )}
                    />

                    <TouchableOpacity onPress={() => setSelectedStore(null)}>
                        <Text style={{ color: 'blue', marginTop: 10 }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
