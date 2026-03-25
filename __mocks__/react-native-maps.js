import { View } from 'react-native';

const MockMapView = ({ children }) => <View testID="map">{children}</View>;

export const Marker = ({ children }) => (
  <View testID="marker">{children}</View>
);

export default MockMapView; 