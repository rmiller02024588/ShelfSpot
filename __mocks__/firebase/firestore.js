module.exports = {
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn((query, callback) => {
    const snapshot = {
      docs: [
        {
          id: 'test-post-1',
          data: () => ({
            coordinates: { latitude: 42.6500221, longitude: -71.3241605 },
            item: 'Test Item',
            description: 'Test content',
          }),
        },
      ],
    };
    callback(snapshot);
    return jest.fn();
  }),
};