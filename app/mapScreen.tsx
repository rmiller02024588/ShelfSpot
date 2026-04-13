import * as Location from 'expo-location';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Circle, Marker } from 'react-native-maps';
import StoreMarker from '../components/storeMarker';
import { auth, db } from '../Firebaseconfig';


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
    // Request permission to access a users location
    const {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return [defaultLatitude, defaultLongitude, defaultAddress];
    }

    // Get the users current location
    let local = await Location.getCurrentPositionAsync({});
    const {latitude, longitude} = local.coords;

    const reverseGeocode = await Location.reverseGeocodeAsync({latitude, longitude});
    if (reverseGeocode && reverseGeocode.length > 0) {
        return [latitude, longitude, reverseGeocode[0]];
    }
    return [latitude, longitude, null];
}

function createRange() {

}

function getPosts() {

}

function getPostinRange() {

}

function buildMarkers() {

}



export default function MapScreen() {
    const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        setPosts(fetched);
        });
    return unsubscribe; 
    }  , []);

    /* useEffect(() => {
    if (!currentUser?.email) return;
    const fetchPosts = async () => {
      const q = query(collection(db, 'posts'), where('author', '==', currentUser.email));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(fetched);
    };
    fetchPosts();


  }, [currentUser?.email]);

useEffect(() => {
  if (!currentUser?.uid) return;

  const q = collection(db, 'users', currentUser.uid, 'posts');

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const fetched = await Promise.all(
      snapshot.docs.map(async (savedDoc) => {
        const postDoc = await getDoc(doc(db, 'posts', savedDoc.id));
        return { id: postDoc.id, ...postDoc.data() };
      })
    );

    setPosts(fetched);
  });

  return unsubscribe; // cleanup listener
}, [currentUser?.uid]); */
    

    /* const [markers] = useState([
        { lat: 42.653509, lon: -71.326595, title: 'Cumnock Hall' },
    ]); */

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
        {posts.map((m) => (
            <Marker
                key={m.id}
                coordinate={{
                    latitude: m.coordinates.latitude,
                    longitude: m.coordinates.longitude
                }}
                title={m.item}
                description={m.description}
            >
                <StoreMarker />
          </Marker>
        ))}
      </MapView>
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
