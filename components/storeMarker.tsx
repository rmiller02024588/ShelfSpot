import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';


export default function StoreMarker({ count }: { count?: number }) {
  return (
    <View style={{
        width: 48,
        height: 48,
        borderRadius: 24, // makes it a circle
        backgroundColor: '#e0e0e0', // light grey
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <MaterialCommunityIcons name="store" size={24} color="black" />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24, // makes it a circle
    backgroundColor: '#e0e0e0', // light grey
    alignItems: 'center',
    justifyContent: 'center',

    // optional shadow (looks nice on iOS + Android)
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});