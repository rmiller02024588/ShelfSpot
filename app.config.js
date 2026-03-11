import 'dotenv/config';

export default {
  expo: {
    name: "test1",
    slug: "test1",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "test1",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourname.test1",
      config: {
        googleMapsApiKey: process.env.AIzaSyBCCXQXzxHNiCPE9dZa_HK9DketbZ0EO94
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.yourname.test1",
      config: {
        googleMaps: {
          apiKey: process.env.AIzaSyBCCXQXzxHNiCPE9dZa_HK9DketbZ0EO94
        }
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ]
      // 👈 react-native-maps removed from here
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};