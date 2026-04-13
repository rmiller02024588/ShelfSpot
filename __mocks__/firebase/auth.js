module.exports = {
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_auth, callback) => {
    callback(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  getReactNativePersistence: jest.fn(() => jest.fn()),
  initializeAuth: jest.fn(() => ({})),
};