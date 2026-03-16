import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { auth } from "../Firebaseconfig";


export default function SignUpScreen({ onGoToLogin }: { onGoToLogin?: () => void }) {

  const scheme = useColorScheme();
  const textColor = scheme === 'dark' ? '#fff' : '#000';

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log(error);
    }
  };

  const makeAccount = async () => {
    try {
        createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.log(error);
    }
  }

  

  return (
    <View style={styles.container}>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" onChangeText={setPassword} secureTextEntry />
      <Button dark={true} mode="contained" onPress={makeAccount}>Sign Up</Button>
      <Button dark={true} mode="contained" onPress={onGoToLogin}>Back to Login</Button>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
});