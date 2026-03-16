import * as React from 'react';
import { View } from 'react-native';
import { Appbar, Badge } from 'react-native-paper';
import Post from '../components/post';

//const LeftContent = props => <Avatar.Icon {...props} icon="folder" />


export default function HomeScreen() {
    return (
    // <View> style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{flex: 1}}>
        <Appbar.Header>
            <View style={{ justifyContent: 'center', marginRight: 10, marginLeft: 10 }}>
                <Badge>{3}</Badge>
            </View>
            <Appbar.Content title="Shelf Spot" />
            <Appbar.Action testID="add-post-button" icon="plus-circle-outline" onPress={() => {}} />
        </Appbar.Header>
        <Post
            title="John Doe"
            subtitle="2 hours ago"
            content="this is a post"
        />
    </View>
  );
}
