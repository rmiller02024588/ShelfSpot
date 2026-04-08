import { db } from '@/Firebaseconfig';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getAuth } from 'firebase/auth';
import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PostCardProps = {
  author: string;
  item: string;
  description: string;
  address: string;
  image: string;
  time: string;
  postId: string;
};

const COLORS = {
  background:    '#FAF7F2',
  card:          '#FFFFFF',
  accent:        '#C0784A',
  accentLight:   '#F5EDE4',
  text:          '#2C1A0E',
  textSecondary: '#8C7B6E',
  border:        '#E8DDD4',
  inputBg:       '#FDF9F5',
};

export default function PostCard({ author, item, description, address, image, time, postId }: PostCardProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
  const user = getAuth().currentUser;
  if (!user) return;

  const ref = doc(db, 'users', user.uid, 'savedPosts', postId);

  const unsubscribe = onSnapshot(ref, (docSnap) => {
    setSaved(docSnap.exists());
  });

  return unsubscribe;
}, [postId, getAuth().currentUser?.uid]);

  const handleSavePress = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
    const newSavedState = !saved;
    setSaved(newSavedState);
    try {
      if (newSavedState) {
        await savePost(postId);
      } else {
        await unsavePost(postId);
      }

       const docSnap = await getDoc(
      doc(db, 'users', user.uid, 'savedPosts', postId)
    );
    setSaved(docSnap.exists());

    } catch (err) {
      setSaved(!newSavedState);
      console.error('Error saving/unsaving post:', err);
    }
  };

  const initials = author
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
            onPress={handleSavePress}
            style={styles.saveButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AntDesign
              name={'heart'}
              size={18}
              color={saved ? COLORS.accent : COLORS.textSecondary}
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


const savePost = async (postId: string) => {
  const user = getAuth().currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid, "savedPosts", postId),
    {
    }
  );
};

const unsavePost = async (postId: string) => {
  const user = getAuth().currentUser;
  if (!user) return;

  await deleteDoc(doc(db, "users", user.uid, "savedPosts", postId));
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#C0784A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    color: COLORS.accent,
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