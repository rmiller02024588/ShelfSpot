import { useState } from 'react';
import { TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    }

    const scheme = useColorScheme();
    const textColor = scheme === 'dark' ? '#fff' : '#000';

  return (
    <SafeAreaView style = {{ flex: 1, marginHorizontal: 20 }}>
      <TextInput placeholder = "Search" 
      clearButtonMode = "always"
      style = {{ 
        paddingHorizontal: 10, 
        paddingVertical: 10, 
        borderColor: "#ccc", 
        borderWidth: 1, 
        borderRadius: 8,
        color: textColor
      }}
      autoCapitalize= "none"
      autoCorrect = {false}
      value = {searchQuery}
      onChangeText = {(query) => handleSearch(query)
      }
      />
    </SafeAreaView>
  );
}