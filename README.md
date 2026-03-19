# ShelfSpot

## Overview
Tired of not being able to find your favorite niche snacks in store?

Try ShelfSpot, a crowd-sourced mobile platform for finding niche and limited-time food and drink products in stores near you. It's built for niche snack enthusiasts who are tired of visiting multiple stores based on outdated inventory information.

Users can post sightings of niche and limited-time items, included in these posts is the store location, a photo, and description, so that other users can find these niche items. Posts are shown through a location-based feed, a keyword search, and an interactive map, making it easy to find exactly what you're looking.

## Tech Stack

- React Native 0.81.5 + Expo 54
- Firebase v12 (Auth + Firestore)
- React Native Paper (UI)
- React Native Maps
- Google Maps API
- Jest + jest-expo (testing)

## Prerequisites

**Node.js v18+** — download and install from [nodejs.org](https://nodejs.org/). Select the LTS version.

To verify your Node.js installation, run:
```bash
node -v
```
You should see `v18.0.0` or higher.

There are 3 ways to run ShelfSpot. Install the prerequisites for whichever you prefer:

### Option 1: Physical Device (Easiest Option)
- Install **Expo Go** on your phone from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Option 2: Android Emulator
- Install **Android Studio** from [developer.android.com/studio](https://developer.android.com/studio)
- Set up a virtual device via the AVD Manager inside Android Studio

### Option 3: iOS Simulator (macOS only)
- Install **Xcode** from the Mac App Store

> **Having trouble?** Refer to the [Expo environment setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=physical) for detailed instructions and troubleshooting.

## Setup & Installation

```bash
git clone https://github.com/rmiller02024588/ShelfSpot.git
cd ShelfSpot
npm install
```

## Running the App

```bash
npx expo start
```

Then Scan the QR code with Expo Go, or press `a` to open on Android emulator, or or press `i` to open on iOS simulator.

## Running Tests

```bash
npm test
```

## Continuous Integration

This project uses GitHub Actions for continuous integration. Every push and pull request to `master` automatically runs the test suite. Build history and logs are visible under the **Actions** tab of this repository.

## Project Structure

```
ShelfSpot/
├── app/              # Screens (bottom nav from react native paper)
├── components/       # Shared components (AuthGate, etc.)
├── __test__/         # Unit tests
├── Firebaseconfig.ts # Firebase initialization
└── .github/          # CI workflows
```