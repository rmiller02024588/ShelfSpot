import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProfileNav } from '../context/ProfileNavContext';

type FollowingCardProps = {
    username: string;
};

const COLORS = {
    card: '#FFFFFF',
    accent: '#C0784A',
    accentLight: '#F5EDE4',
    text: '#2C1A0E',
    border: '#E8DDD4',
};

export default function FollowingCard({ username }: FollowingCardProps) {
    const { onViewProfile } = useProfileNav();

    const initials = username
        ? username
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onViewProfile(username)}
            activeOpacity={0.7}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Text style={styles.username}>{username}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        marginHorizontal: 16,
        marginVertical: 6,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',

        shadowColor: '#C0784A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },

    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.accentLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    avatarText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.accent,
    },

    username: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
});