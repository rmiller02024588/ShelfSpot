import { Text, View, useColorScheme } from 'react-native';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const textColor = scheme === 'dark' ? '#fff' : '#000';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: textColor }}>Settings Screen</Text>
    </View>
  );
}
