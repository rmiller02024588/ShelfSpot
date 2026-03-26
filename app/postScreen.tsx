import AntDesign from '@expo/vector-icons/AntDesign';
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import { Appbar, TextInput } from 'react-native-paper';
import { auth, db } from '../Firebaseconfig';

type PostScreenProps = {
  onBack: () => void;
};

const data = [
  { label: 'Snack', value: '1' },
  { label: 'Drink', value: '2' },
];

export default function PostScreen({ onBack }: PostScreenProps) {
  const [itemValue, setItemValue] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Action testID="backButton" icon="arrow-left" onPress={onBack} />
        <Appbar.Content title="Shelf Spot" />
        <Appbar.Action testID="postButton" icon="check" onPress={
          async () => {
            await addDoc(collection(db, "posts"), {
              author: auth.currentUser?.email || 'Unknown',
              item: itemValue,
              address: addressValue,
              description: descriptionValue,
              time: Timestamp.fromDate(new Date()),
              type: selected,
              imageURL: 'https://pepsimidamerica.com/wp-content/uploads/2022/04/pepsi-mid-america-marion-illinois-nitro-pepsi-draft-cola.jpg',
            });
            onBack();
          }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.name}>Item Name</Text>
        <TextInput
          style={styles.input}
          value={itemValue}
          onChangeText={setItemValue}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Add item..."
          clearButtonMode='always'
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.name}>Item Location</Text>
        <TextInput
          style={styles.input}
          value={addressValue}
          onChangeText={setAddressValue}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Add item location..."
          clearButtonMode='always'
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.name}>Item Description</Text>
        <TextInput
          style={styles.inputTall}
          value={descriptionValue}
          onChangeText={setDescriptionValue}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Add item description..."
          clearButtonMode='always'
          multiline
          textAlignVertical="top"
        />

        <View style={styles.container}>
          <MultiSelect
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            search
            data={data}
            labelField="label"
            valueField="value"
            placeholder="Select item type"
            searchPlaceholder="Search..."
            value={selected}
            onChange={item => setSelected(item)}
            renderLeftIcon={() => (
              <AntDesign style={styles.icon} color="black" size={20} />
            )}
            selectedStyle={styles.selectedStyle}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  container: { padding: 20 },
  name: { color: '#000', fontSize: 18, fontWeight: 'bold', marginTop: 10, marginHorizontal: 20 },
  input: { borderWidth: 1, borderColor: '#000', borderRadius: 6, fontSize: 16, marginBottom: 10, marginHorizontal: 20, backgroundColor: '#fff', minHeight: 50 },
  inputTall: { borderWidth: 1, borderColor: '#000', borderRadius: 6, fontSize: 16, marginBottom: 10, marginHorizontal: 20, backgroundColor: '#fff', minHeight: 120 },
  dropdown: { height: 50, backgroundColor: 'transparent', borderBottomColor: 'gray', borderBottomWidth: 0.5 },
  placeholderStyle: { fontSize: 16 },
  selectedTextStyle: { fontSize: 14 },
  iconStyle: { width: 20, height: 20 },
  inputSearchStyle: { height: 40, fontSize: 16 },
  icon: { marginRight: 5 },
  selectedStyle: { borderRadius: 12 },
});