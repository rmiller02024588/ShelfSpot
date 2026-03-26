import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Avatar, Card, IconButton, Text } from 'react-native-paper';

type PostCardProps = {
    title: string;
    subtitle: string;
    content: string;
    image: string;
};

export default function PostCard({ title, subtitle, content, image }: PostCardProps) {
    return (
        <Card style={styles.card} mode="elevated">
            <Card.Title
                title={title}
                subtitle={subtitle}
                left={(props) => <Avatar.Text {...props} label={title[0]} />}
                right={(props) => <Image source={{ uri: image }}
                    style={{ width: 100, height: 100, borderRadius: 20, margin: 10 }} />}
            />
            <Card.Content>
                <Text variant="bodyMedium">{content}</Text>
            </Card.Content>
            <Card.Actions>
                <IconButton icon="bookmark-outline" onPress={() => { }} />
            </Card.Actions>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 10,
    },
});