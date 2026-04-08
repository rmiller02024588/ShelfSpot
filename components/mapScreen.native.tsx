import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

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
  const [markers] = useState([
    { lat: 42.653509, lon: -71.326595, title: 'Cumnock Hall' },
  ]);
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
        {markers.map((m, i) => (
            <Marker
                key={i}
                coordinate={{ latitude: m.lat, longitude: m.lon }}
                title={m.title}
                description="Pepsi Nitro found Here!"
            >
           {/*  <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={require('../assets/images/pepsi_nitro.png')}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </View> */}
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
