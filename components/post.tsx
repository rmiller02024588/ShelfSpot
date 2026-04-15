import { db } from '@/Firebaseconfig';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getAuth } from 'firebase/auth';
import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useProfileNav } from '../context/ProfileNavContext';

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

const GHOST_SIZE = 90;

export default function PostCard({ author, item, description, address, image, time, postId }: PostCardProps) {
  const [saved, setSaved] = useState(false);
  const [ghostVisible, setGhostVisible] = useState(false);
  const { onViewProfile } = useProfileNav();
  const { width: screenWidth } = useWindowDimensions();

  // card bounce
  const postY = useSharedValue(0);
  // ghost position & rotation
  const ghostX = useSharedValue(-GHOST_SIZE);
  const ghostY = useSharedValue(0);
  const ghostRotate = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);
  const ghostScale = useSharedValue(0.6);
  // button icon
  const iconScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: postY.value }],
  }));

  const animatedGhostStyle = useAnimatedStyle(() => ({
    opacity: ghostOpacity.value,
    transform: [
      { translateX: ghostX.value },
      { translateY: ghostY.value },
      { rotate: `${ghostRotate.value}deg` },
      { scale: ghostScale.value },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'savedPosts', postId);
    const unsubscribe = onSnapshot(ref, (docSnap) => {
      setSaved(docSnap.exists());
    });
    return unsubscribe;
  }, [postId, getAuth().currentUser?.uid]);

  const hideGhost = () => setGhostVisible(false);

  const handleSavePress = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    const newSavedState = !saved;
    setSaved(newSavedState);

    // reset ghost to start position (left of screen, mid height)
    ghostX.value = -GHOST_SIZE;
    ghostY.value = 0;
    ghostRotate.value = -15;
    ghostScale.value = 0.6;
    ghostOpacity.value = 0;
    setGhostVisible(true);

    // phase 1: ghost glides in from left to center, tilting slightly
    ghostOpacity.value = withTiming(1, { duration: 180 });
    ghostScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
    ghostX.value = withTiming(screenWidth / 2 - GHOST_SIZE / 2, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
    ghostRotate.value = withTiming(5, { duration: 350 });

    // phase 2: after arriving center, jolt upward (the lick) with wobble rotation
    setTimeout(() => {
      ghostRotate.value = withSequence(
        withTiming(-20, { duration: 120 }),
        withTiming(15,  { duration: 100 }),
        withTiming(-10, { duration: 90  }),
        withTiming(5,   { duration: 80  }),
      );
      ghostY.value = withSequence(
        withSpring(-320, { damping: 5, stiffness: 280 }),
        withTiming(-600, { duration: 250, easing: Easing.in(Easing.cubic) }),
      );
      ghostOpacity.value = withSequence(
        withTiming(1,  { duration: 300 }),
        withTiming(0,  { duration: 200 }),
      );

      // card reacts: single clean bounce up then back down
      postY.value = withSequence(
        withTiming(-14, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0,   { duration: 180, easing: Easing.in(Easing.cubic) }),
      );

      setTimeout(() => hideGhost(), 550);
    }, 370);

    // button icon bounce
    iconScale.value = withSequence(withSpring(1.5), withSpring(1));

    try {
      if (newSavedState) {
        await savePost(postId);
      } else {
        await unsavePost(postId);
      }
      const docSnap = await getDoc(doc(db, 'users', user.uid, 'savedPosts', postId));
      setSaved(docSnap.exists());
    } catch (err) {
      setSaved(!newSavedState);
      console.error('Error saving/unsaving post:', err);
    }
  };

  const initials = author
    ? author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
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
            <TouchableOpacity
              style={styles.authorPressable}
              onPress={() => onViewProfile(author)}
              activeOpacity={0.6}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{author}</Text>
                <Text style={styles.timeText}>{time}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSavePress}
              style={styles.lickButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View style={animatedIconStyle}>
                <MaterialCommunityIcons
                  name="emoticon-tongue"
                  size={22}
                  color={saved ? COLORS.accent : COLORS.textSecondary}
                />
              </Animated.View>
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

      {/* Ghost overlay — positioned relative to card but large enough to escape upward */}
      {ghostVisible && (
        <Animated.Image
          source={require('../images/tounge.png')}
          style={[styles.ghost, animatedGhostStyle]}
        />
      )}
    </Animated.View>
  );
}

const savePost = async (postId: string) => {
  const user = getAuth().currentUser;
  if (!user) return;
  await setDoc(doc(db, 'users', user.uid, 'savedPosts', postId), {});
};

const unsavePost = async (postId: string) => {
  const user = getAuth().currentUser;
  if (!user) return;
  await deleteDoc(doc(db, 'users', user.uid, 'savedPosts', postId));
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#C0784A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  ghost: {
    position: 'absolute',
    width: GHOST_SIZE,
    height: GHOST_SIZE,
    bottom: 0,
    left: 0,
    resizeMode: 'contain',
    zIndex: 99,
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
  authorPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  lickButton: {
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
