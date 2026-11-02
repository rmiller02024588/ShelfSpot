import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProfileNav } from '../context/ProfileNavContext';
import { useThemeColors, type AppColors } from '../lib/theme';

type FollowingCardProps = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
};

export default function FollowingCard({ userId, displayName, avatarUrl }: FollowingCardProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { onViewProfile } = useProfileNav();

  const initials = displayName
    ? displayName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewProfile(userId)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      <Text style={styles.username}>{displayName}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
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
