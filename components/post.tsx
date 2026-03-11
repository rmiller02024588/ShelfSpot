import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, Card, IconButton, Text } from 'react-native-paper';

type PostCardProps = {
  title: string;
  subtitle: string;
  content: string;
};

export default function PostCard({ title, subtitle, content}: PostCardProps) {
    return (
        <Card style={styles.card} mode="elevated">
            <Card.Title
                title={title}
                subtitle={subtitle}
                left={(props) => <Avatar.Text {...props} label={title[0]} />}
            />
            <Card.Content>
                <Text variant="bodyMedium">{content}</Text>
            </Card.Content>
            <Card.Actions>
                <IconButton icon="heart-outline" onPress={() => {}} />
                <IconButton icon="comment-outline" onPress={() => {}} />
                <IconButton icon="share-outline" onPress={() => {}} />
            </Card.Actions>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 10,
    },
});