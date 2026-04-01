// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFKwnXECJN0y44A5S-wnERJh0iuxmgVaw",
  authDomain: "shelfspot-39b16.firebaseapp.com",
  projectId: "shelfspot-39b16",
  storageBucket: "shelfspot-39b16.firebasestorage.app",
  messagingSenderId: "775939123357",
  appId: "1:775939123357:web:28a2207aba54b07d59cc74",
  measurementId: "G-VXTPGFXPWR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);