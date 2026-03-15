import React from "react";
import { Alert, Button, Image, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Appbar } from 'react-native-paper';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const textColor = scheme === 'dark' ? '#fff' : '#000';

  const onPress = () => {
    Alert.alert('You pressed the button ;)');
  };

  return (
    <View style={{ flex: 1}}>
      <Appbar.Header>
            <Appbar.Content title="Shelf Spot" />
        </Appbar.Header>
        <Image
        source={require("../assets/images/default_pfp.png")}
        style={{
          width: 250,
          height: 250, 
          justifyContent: 'center', 
          alignSelf: 'center', 
          marginTop: 20
        }} /> 

        <Text style={{ 
          color: textColor, 
          fontSize: 24, fontWeight: 'bold', 
          textAlign: 'center', 
          marginTop: 10 }}>John Doe</Text>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title="Change Profile Picture"
              color={"#FFF"}
              onPress={() => {onPress()}}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Change Username"
              color={"#FFF"}
              onPress={() => {onPress()}}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Change Password"
              color={"#FFF"}
              onPress={() => {onPress()}}
            />
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    backgroundColor: '#828282',
    borderRadius: 8,
    padding: 5,
    width: '80%',
    marginVertical: 6,
  },
});
