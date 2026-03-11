import { useState } from 'react';
import { SafeAreaView, StyleSheet, TextInput } from 'react-native';

const styles = StyleSheet.create ({
    searchBox: { 
        paddingHorizontal: 10, 
        paddingVertical: 10, 
        borderColor: "#ccc", 
        borderWidth: 1, 
        borderRadius: 8,
        color: '#fff'
    }
});

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    }
  return (
    <SafeAreaView style = {{ flex: 1, marginHorizontal: 20 }}>
      <TextInput placeholder = "Search" 
      clearButtonMode = "always"
      style = {styles.searchBox} 
      autoCapitalize= "none"
      autoCorrect = {false}
      value = {searchQuery}
      onChangeText = {(query) => handleSearch(query)}
      />
    </SafeAreaView>
  );
}