import 'dotenv/config';

export default {
  expo: {
    name: "ShelfSpot",
    slug: "ShelfSpot",
    extra: {
      eas: { projectId: "a95b7187-3ed9-4051-81de-fc18be38d8aa" }
    },
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ShelfSpot",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.camgagne.shelfspot",
      buildNumber: "1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "ShelfSpot uses your location to show nearby shelf spots on the map.",
        NSCameraUsageDescription:
          "ShelfSpot uses your camera so you can take photos for posts.",
        NSPhotoLibraryUsageDescription:
          "ShelfSpot accesses your photo library so you can attach photos to posts.",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      package: "com.camgagne.shelfspot",
      versionCode: 1,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "ShelfSpot uses your location to show nearby shelf spots on the map.",
        }
      ],
      [
        "expo-image-picker",
        {
          cameraPermission:
            "ShelfSpot uses your camera so you can take photos for posts.",
          photosPermission:
            "ShelfSpot accesses your photo library so you can attach photos to posts.",
        }
      ],
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
      ],
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey:
            process.env.EXPO_PUBLIC_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY,
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
  }
};

