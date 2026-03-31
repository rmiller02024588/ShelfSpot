import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PostCardProps = {
  author: string;
  item: string;
  description: string;
  address: string;
  image: string;
  time: string;
};

const COLORS = {
  background: '#F2F2F2',
  card: '#FFFFFF',
  accent: '#1A1A1A',
  accentLight: '#F0F0F0',
  text: '#1A1A1A',
  textSecondary: '#8A8A8A',
  border: '#E0E0E0',
};

export default function PostCard({ author, item, description, address, image, time }: PostCardProps) {
  const [saved, setSaved] = useState(false);

  const initials = (author ?? '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.card}>
      {/* Image */}
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <AntDesign name="picture" size={32} color={COLORS.textSecondary} />
        </View>
      )}

      <View style={styles.body}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{author}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSaved(s => !s)}
            style={styles.saveButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AntDesign
              name={'heart'}
              size={18}
              color={saved ? '#1A1A1A' : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Item name */}
        <Text style={styles.itemName}>{item}</Text>

        {/* Description */}
        {description ? (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        ) : null}

        {/* Location */}
        {address ? (
          <View style={styles.locationRow}>
            <AntDesign name="pushpin" size={12} color={COLORS.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{address}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 400,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  saveButton: {
    padding: 4,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
});