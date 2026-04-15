import AntDesign from '@expo/vector-icons/AntDesign';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { Appbar } from 'react-native-paper';
import { db } from '../Firebaseconfig';
import Post from '../components/post';

// ── Cat sprite animator ──────────────────────────────────────────────────────

const FRAME_SIZE   = 32;   // source px per frame
const DISPLAY_SIZE = 56;   // rendered px
const FRAME_MS     = 150;  // ms per frame
const ANIM_MS      = 30_000; // ms before auto-switching animation

const BOWL_DISPLAY = 40;


const EATING_ANIM = { frames: 15, src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Eating.png') };
const DANCE_ANIM  = { frames: 4,  src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Dance.png') };
const SLEEP_ANIM  = { frames: 4,  src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Sleep.png') };
const CRY_ANIM    = { frames: 4,  src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Cry.png') };

const NORMAL_ANIMS = [
  { frames: 10, src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Idle.png') },
  { frames: 8,  src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Sleepy.png') },
  SLEEP_ANIM,
  DANCE_ANIM,
  { frames: 12, src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/Excited.png') },
];

const POKE_ANIMS = [
  { frames: 1, src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/DeadCat.png') },
  { frames: 5, src: require('../images/CatMegaBundle/Mochi/Sprites/Classical/Individual/catsick1.png') },
];

const FEED_INTERVAL = 10 * 60 * 1000; // 10 minutes

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type CatAnim = { frames: number; src: any };

function useCatAnim() {
  // start crying — cat is hungry on launch
  const [anim, setAnim]       = useState<CatAnim>(CRY_ANIM);
  const [frame, setFrame]     = useState(0);
  const [isBusy, setIsBusy]   = useState(false);
  const [isHungry, setIsHungry] = useState(true);
  const frameRef              = useRef(0);
  const animRef               = useRef(anim);
  const hungerTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  // frame ticker
  useEffect(() => {
    animRef.current = anim;
    frameRef.current = 0;
    setFrame(0);
    const tick = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % animRef.current.frames;
      setFrame(frameRef.current);
    }, FRAME_MS);
    return () => clearInterval(tick);
  }, [anim]);

  // auto-rotate normal anims (only when not busy and not hungry)
  useEffect(() => {
    if (isBusy || isHungry) return;
    const tick = setInterval(() => setAnim(pickRandom(NORMAL_ANIMS)), ANIM_MS);
    return () => clearInterval(tick);
  }, [isBusy, isHungry]);

  // hunger timer — starts after feeding, triggers crying after 10 min
  const startHungerTimer = () => {
    if (hungerTimerRef.current) clearTimeout(hungerTimerRef.current);
    hungerTimerRef.current = setTimeout(() => {
      setIsHungry(true);
      setIsBusy(false);
      setAnim(CRY_ANIM);
    }, FEED_INTERVAL);
  };

  const poke = () => {
    if (isBusy || isHungry) return;
    setIsBusy(true);
    setAnim(pickRandom(POKE_ANIMS));
    setTimeout(() => { setAnim(pickRandom(NORMAL_ANIMS)); setIsBusy(false); }, 3000);
  };

  const feed = () => {
    if (isBusy) return;
    setIsHungry(false);
    setIsBusy(true);
    setAnim(EATING_ANIM);
    const eatDuration   = EATING_ANIM.frames * FRAME_MS;
    const danceDuration = DANCE_ANIM.frames * FRAME_MS * 4;
    setTimeout(() => setAnim(DANCE_ANIM), eatDuration);
    setTimeout(() => setAnim(SLEEP_ANIM), eatDuration + danceDuration);
    setTimeout(() => {
      setAnim(pickRandom(NORMAL_ANIMS));
      setIsBusy(false);
      startHungerTimer();
    }, eatDuration + danceDuration + 10_000);
  };

  return { anim, frame, isBusy, isHungry, poke, feed };
}

function CatWidget() {
  const { anim, frame, isBusy, isHungry, poke, feed } = useCatAnim();
  const scale = DISPLAY_SIZE / FRAME_SIZE;

  return (
    <View style={catStyles.row}>
      {/* Cat */}
      <TouchableOpacity onPress={poke} activeOpacity={0.8} disabled={isBusy || isHungry}>
        <View style={catStyles.clip}>
          <Image
            source={anim.src}
            style={{
              width: anim.frames * FRAME_SIZE * scale,
              height: DISPLAY_SIZE,
              transform: [{ translateX: -frame * DISPLAY_SIZE }],

            }}
            resizeMode="stretch"
          />
        </View>
      </TouchableOpacity>

      {/* Cat food — only visible when hungry */}
      {isHungry && (
        <TouchableOpacity onPress={feed} activeOpacity={0.8}>
          <Image
            source={require('../images/CatMegaBundle/Mochi/CatItems/CatToys/catfood.png')}
            style={{ width: BOWL_DISPLAY, height: BOWL_DISPLAY }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const catStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  clip: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    overflow: 'hidden',
  },
});

interface PostData {
  id: string;
  author: string;
  description: string;
  imageURL: string;
  item: string;
  time: any;
  address: string;
}

type HomeScreenProps = {
  onAddPost: () => void;
};

const CATEGORIES = [
  { label: 'Snack', value: '1' },
  { label: 'Drink', value: '2' },
];

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

export default function HomeScreen({ onAddPost }: HomeScreenProps) {
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchPosts = async () => {
    setRefreshing(true);

    let q;
    if (selected.length > 0) {
      q = query(
        collection(db, 'posts'),
        where('type', 'array-contains-any', selected),
        orderBy('time', 'desc')
      );
    } else {
      q = query(collection(db, 'posts'), orderBy('time', 'desc'));
    }

    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<PostData, 'id'>
    }));
    setPosts(fetched);
    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchPosts();
  }, [selected]);

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header} elevated={false}>
        <View style={styles.catSlot}>
          <CatWidget />
        </View>
        <Appbar.Content
          title="Shelf Spot"
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action
          testID="add-post-button"
          icon="plus-circle-outline"
          onPress={onAddPost}
          iconColor={COLORS.accent}
        />
      </Appbar.Header>

      <View style={styles.filterBar}>
        <AntDesign name="tag" size={15} color={COLORS.textSecondary} style={styles.filterIcon} />
        <Text style={styles.filterLabel}>Filter:</Text>
        <MultiSelect
          renderSelectedItem={(item, unSelect) => (
            <TouchableOpacity onPress={() => unSelect && unSelect(item)} style={styles.selectedChip}>
              <Text style={styles.selectedChipText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          inputSearchStyle={styles.dropdownSearch}
          iconStyle={styles.dropdownIcon}
          containerStyle={styles.dropdownContainer}
          activeColor={COLORS.accentLight}
          search
          data={CATEGORIES}
          labelField="label"
          valueField="value"
          placeholder="All categories"
          searchPlaceholder="Search…"
          value={selected}
          onChange={item => setSelected(item)}
          selectedStyle={styles.selectedChip}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={fetchPosts}
        renderItem={({ item }) => (
          <Post
            author={item.author}
            time={item.time?.toDate().toLocaleString() ?? ''}
            item={item.item}
            description={item.description}
            address={item.address}
            image={item.imageURL}
            postId={item.id}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 0,
  },
  catSlot: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterIcon: {
    marginTop: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  dropdown: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownSearch: {
    height: 40,
    fontSize: 14,
    color: COLORS.text,
    borderColor: COLORS.border,
  },
  dropdownIcon: {
    width: 18,
    height: 18,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderColor: COLORS.border,
    marginTop: 4,
    shadowColor: '#C0784A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedChip: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginVertical: 3,
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});