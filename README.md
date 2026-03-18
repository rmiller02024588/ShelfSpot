# ShelfSpot

## Overview
<!-- Describe what ShelfSpot does and who it's for -->

## Tech Stack

- React Native 0.81.5 + Expo 54
- Firebase v12 (Auth + Firestore)
- React Native Paper (UI)
- React Native Maps
- Jest + jest-expo (testing)

## Prerequisites

- Node.js v18+
- Expo Go app installed on your device or Android emulator via Android Studio

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

Then press `a` to open on Android emulator, or scan the QR code with Expo Go.

## Running Tests

```bash
npm test
```

## Project Structure

```
ShelfSpot/
├── app/              # Screens (file-based routing via Expo Router)
├── components/       # Shared components (AuthGate, etc.)
├── __test__/         # Unit tests
├── Firebaseconfig.ts # Firebase initialization
└── .github/          # CI workflows
```

## Contributing
<!-- Describe branching strategy and PR process -->
