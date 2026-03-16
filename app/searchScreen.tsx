
import Post from '@/components/post';
import filter from 'lodash/filter';
import { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, useColorScheme, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserName {
  title: string;
  first: string;
  last: string;
}

interface User {
  name: UserName;
  email: string;
}

interface ApiResponse {
  results: User[];
}


const API_ENDPOINT = 'https://randomuser.me/api/?results=20';


export default function SearchScreen() {
  const scheme = useColorScheme();
  const textColor = scheme === 'dark' ? '#fff' : '#000';
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<User[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [fullData, setFullData] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
      setIsLoading(true);
      fetchData(API_ENDPOINT);
    }, []);


    const fetchData = async (url: string): Promise<void> => {
      try {
        const response = await fetch(url);
        const json: ApiResponse = await response.json();
        setData(json.results);
        
        console.log(json.results);

        setFullData(json.results);
        setIsLoading(false);

      } catch (error: any) {
        setError(error);
        console.log(error);
        setIsLoading(false);
      }
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredData =filter(fullData, (user) => {
          return constains(user, formattedQuery);
        });
        setData(filteredData);
    }

    const constains = ({ name: { first, last } }: User, query: string) => {
      if (first.toLowerCase().includes(query) || last.toLowerCase().includes(query) || 
      (first.toLowerCase() + " " + last.toLowerCase()).includes(query))  {
        return true;
      }
      return false;

    };

    if (isLoading) {
      return (
        <View>
          <ActivityIndicator size="large" color="#828282"/>
        </View>
      );
    }

    if (error) {
      return (
        <View>
          <Text>Error fetching data</Text>
        </View>
      );
    }

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

      <FlatList 
      data={data}
      keyExtractor ={(item) => item.name.first + item.name.last}
      renderItem = {({item}) => (
        <Post
          title={item.name.first + " " + item.name.last}
          subtitle="Posted 1 hour ago"
          content="I found Pepsi Nitro at Cumnock Hall!!"
        />
      )}
      />
    </SafeAreaView>
  );
}