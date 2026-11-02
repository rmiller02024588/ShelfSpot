import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Appbar } from 'react-native-paper';
import { getDisplayName, syncProfileFromUser } from '../lib/auth';
import { CATEGORIES } from '../lib/categories';
import { useThemeColors, type AppColors } from '../lib/theme';
import { supabase } from '../Supabaseconfig';

type PostScreenProps = {
  onBack: () => void;
};

export default function PostScreen({ onBack }: PostScreenProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [itemValue, setItemValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [latValue, setLatValue] = useState(0);
  const [longValue, setLongValue] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!apiKey) {
      Alert.alert('API Key Missing', 'To make a post, a Google Maps API key is required. Please set the EXPO_PUBLIC_API_KEY environment variable.');
      return;
    }

    if (itemValue !== '' && addressValue !== '' && descriptionValue !== '' && selected !== null && image !== null) {
      if (!Number.isFinite(latValue) || !Number.isFinite(longValue) || (latValue === 0 && longValue === 0)) {
        Alert.alert('Missing location', 'Please select an address from the search suggestions so the map can place your post.');
        return;
      }

      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

      if (uploadError) {
        Alert.alert('Upload failed', uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in', 'Please log in again before posting.');
        return;
      }

      await syncProfileFromUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      const postData = {
        user_id: user.id,
        author: profile?.display_name || getDisplayName(user),
        item: itemValue,
        address: addressValue,
        description: descriptionValue,
        time: new Date().toISOString(),
        type: selected,
        image_url: publicUrl,
        latitude: latValue,
        longitude: longValue,
        exp_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { error } = await supabase.from('posts').insert(postData);
      if (error) {
        Alert.alert('Post failed', error.message);
        return;
      }

      onBack();
    }
    else {
      Alert.alert('Missing fields', 'Please fill out all fields and select a category.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <Appbar.Header style={styles.header} elevated={false}>
        <Appbar.Action
          testID="backButton"
          icon="arrow-left"
          onPress={onBack}
          iconColor={COLORS.text}
        />
        <Appbar.Content
          title="New Post"
          titleStyle={styles.headerTitle}
        />
        <TouchableOpacity style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
            {/* Item Name */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={itemValue}
                onChangeText={setItemValue}
                autoCorrect={false}
                placeholder="What did you find?"
                placeholderTextColor={COLORS.textSecondary}
                clearButtonMode="always"
                caretHidden={false}
                selectionColor={COLORS.accent}
                cursorColor={COLORS.accent}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* Location */}
            <View style={[styles.card, styles.locationCard]}>
              <Text style={styles.sectionLabel}>Location</Text>
              <View style={styles.locationInputWrapper}>
                <AntDesign name="pushpin" size={16} color={COLORS.accent} style={styles.locationIcon} />
                <GooglePlacesAutocomplete
                  placeholder="Search for an address..."
                  onPress={(data, details = null) => {
                    const location = details?.geometry?.location;
                    if (!location) {
                      Alert.alert('Location unavailable', 'Could not load coordinates for that address. Please try another suggestion.');
                      return;
                    }
                    setAddressValue(data.description);
                    setLatValue(location.lat);
                    setLongValue(location.lng);
                    Keyboard.dismiss();
                  }}
                  query={{
                    key: apiKey,
                    language: 'en',
                  }}
                  fetchDetails={true}
                  enablePoweredByContainer={false}
                  listViewDisplayed="auto"
                  styles={{
                    container: { flex: 0, flexGrow: 1, zIndex: 2 },
                    textInputContainer: { backgroundColor: 'transparent' },
                    textInput: {
                      height: 44,
                      fontSize: 15,
                      color: COLORS.text,
                      backgroundColor: COLORS.inputBg,
                      paddingHorizontal: 8,
                      margin: 0,
                      borderRadius: 0,
                    },
                    listView: {
                      backgroundColor: COLORS.card,
                      borderRadius: 8,
                      marginTop: 4,
                      elevation: 4,
                      zIndex: 3,
                    },
                    row: { paddingVertical: 10 },
                    description: { color: COLORS.text, fontSize: 14 },
                  }}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((category) => {
                  const isSelected = selected === category.value;
                  return (
                    <TouchableOpacity
                      key={category.value}
                      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                      onPress={() => {
                        setSelected(category.value);
                        Keyboard.dismiss();
                      }}
                      activeOpacity={0.75}
                    >
                      <AntDesign
                        name="tag"
                        size={14}
                        color={isSelected ? COLORS.onAccent : COLORS.accent}
                      />
                      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Description</Text>
              <TextInput
                style={styles.inputTall}
                value={descriptionValue}
                onChangeText={(text) => setDescriptionValue(text.slice(0, 300))}
                autoCorrect={false}
                placeholder="Describe the item, condition, quantity..."
                placeholderTextColor={COLORS.textSecondary}
                textAlignVertical="top"
                multiline
                blurOnSubmit={false}
                caretHidden={false}
                selectionColor={COLORS.accent}
                cursorColor={COLORS.accent}
              />
              <Text style={styles.charCount}>{descriptionValue.length} / 300</Text>
            </View>

            {/* Photo */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Photo</Text>
              <TouchableOpacity
                style={[styles.imagePicker, image ? styles.imagePickerFilled : null]}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                {image ? (
                  <>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <View style={styles.imageOverlay}>
                      <AntDesign name="edit" size={20} color="#fff" />
                      <Text style={styles.imageOverlayText}>Change photo</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePickerEmpty}>
                    <View style={styles.imagePickerIconCircle}>
                      <AntDesign name="camera" size={24} color={COLORS.accent} />
                    </View>
                    <Text style={styles.imagePickerTitle}>Add a photo</Text>
                    <Text style={styles.imagePickerSubtitle}>Tap to browse your camera roll</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  postButton: {
    marginRight: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: COLORS.onAccent,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  locationCard: {
    overflow: 'visible',
    zIndex: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  inputTall: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    fontSize: 15,
    minHeight: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingLeft: 10,
    minHeight: 44,
  },
  locationIcon: {
    marginRight: 4,
  },

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryChipTextSelected: {
    color: COLORS.onAccent,
  },

  imagePicker: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerFilled: {
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  imagePickerEmpty: {
    alignItems: 'center',
    padding: 24,
  },
  imagePickerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  imagePickerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  bottomSpacer: { height: 20 },
});
