import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  const [markers] = useState([
    { lat: 42.653509, lon: -71.326595, title: 'Pepsi Nitro' },
  ]);
  return (
    <View style={styles.container}>
      <MapView 
      style={styles.map} 
      initialRegion={{
        latitude: 42.6459,
        longitude: -71.3127,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}>
        {markers.map((m, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: m.lat, longitude: m.lon }}
            title={m.title}
            description="Pepsi Nitro found at Cumnock Hall!"
          >
            <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={require('../assets/images/pepsi_nitro.png')}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </View>
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