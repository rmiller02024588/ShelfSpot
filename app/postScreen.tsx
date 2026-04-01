import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, GeoPoint, Timestamp } from "firebase/firestore";
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Appbar, TextInput } from 'react-native-paper';
import { auth, db } from '../Firebaseconfig';

type PostScreenProps = {
  onBack: () => void;
};

const CATEGORIES = [
  { label: 'Snack', value: '1' },
  { label: 'Drink', value: '2' },
];

const COLORS = {
  background: '#F2F2F2',
  card: '#FFFFFF',
  accent: '#1A1A1A',
  accentLight: '#F0F0F0',
  text: '#1A1A1A',
  textSecondary: '#8A8A8A',
  border: '#E0E0E0',
  inputBg: '#FAFAFA',
};

export default function PostScreen({ onBack }: PostScreenProps) {
  const [itemValue, setItemValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [latValue, setLatValue] = useState(0);
  const [longValue, setLongValue] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (itemValue !== '' && addressValue !== '' && descriptionValue !== '' && selected.length > 0) {
      await addDoc(collection(db, "posts"), {
        author: auth.currentUser?.email,
        item: itemValue,
        address: addressValue,
        description: descriptionValue,
        time: Timestamp.fromDate(new Date()),
        type: selected,
        imageURL: image,
        coordinates: new GeoPoint(latValue, longValue),
      });
      onBack();
    }
    else {
      Alert.alert('Missing fields', 'Please fill out all fields and select at least one category.');
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

      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        data={[]}
        keyExtractor={() => 'key'}
        renderItem={null}
        ListHeaderComponent={
          <>
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
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={COLORS.text}
                theme={{ colors: { background: COLORS.inputBg } }}
              />
            </View>

            {/* Location */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Location</Text>
              <View style={styles.locationInputWrapper}>
                <AntDesign name="pushpin" size={16} color={COLORS.accent} style={styles.locationIcon} />
                <GooglePlacesAutocomplete
                  placeholder="Search for an address..."
                  onPress={(data, details = null) => {
                    const { lat, lng } = details!.geometry.location;
                    setAddressValue(data.description);
                    setLatValue(lat);
                    setLongValue(lng);
                  }}
                  query={{
                    key: apiKey,
                    language: 'en',
                  }}
                  fetchDetails={true}
                  styles={{
                    container: { flex: 1 },
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
              <MultiSelect
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                inputSearchStyle={styles.dropdownSearch}
                iconStyle={styles.dropdownIcon}
                containerStyle={styles.dropdownContainer}
                search
                data={CATEGORIES}
                labelField="label"
                valueField="value"
                placeholder="Select categories..."
                searchPlaceholder="Search..."
                value={selected}
                onChange={item => setSelected(item)}
                renderLeftIcon={() => (
                  <AntDesign name="tag" style={styles.dropdownLeftIcon} color={COLORS.accent} size={16} />
                )}
                selectedStyle={styles.selectedChip}
              />
            </View>

            {/* Description */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Description</Text>
              <TextInput
                style={styles.inputTall}
                value={descriptionValue}
                onChangeText={setDescriptionValue}
                autoCorrect={false}
                placeholder="Describe the item, condition, quantity..."
                placeholderTextColor={COLORS.textSecondary}
                clearButtonMode="always"
                multiline
                textAlignVertical="top"
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={COLORS.text}
                theme={{ colors: { background: COLORS.inputBg } }}
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
          </>
        }
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
    color: '#fff',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    paddingHorizontal: 0,
  },
  inputTall: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    fontSize: 15,
    minHeight: 110,
    paddingHorizontal: 0,
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

  dropdown: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownSearch: {
    height: 40,
    fontSize: 15,
    color: COLORS.text,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderColor: COLORS.border,
  },
  dropdownLeftIcon: {
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 20,
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  selectedChipText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 13,
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