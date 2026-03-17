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
            title="Jon Snow"
            subtitle="2 hours ago"
            content="I found Pepsi Nitro at Castle Black! It's amazing!"
            image="https://pepsimidamerica.com/wp-content/uploads/2022/04/pepsi-mid-america-marion-illinois-nitro-pepsi-draft-cola.jpg"
        />
        <Post
            title="Ser Duncan"
            subtitle="8 hours ago"
            content="I found Skittles Pop'd at the Inn at the Crossroads!"
            image="https://target.scene7.com/is/image/Target/GUEST_f146398b-3fef-4f14-bc51-bafaf8660f87?wid=300&hei=300&fmt=pjpeg"
        />
    </View>
  );
}
