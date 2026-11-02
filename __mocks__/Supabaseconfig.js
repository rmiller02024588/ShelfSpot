const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
};

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
};

mockQuery.select.mockImplementation(() => ({
  ...mockQuery,
  then: (resolve) => resolve({ data: [], error: null, count: 0 }),
}));

export const supabase = {
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: 'test-uid', email: 'test@example.com', user_metadata: { display_name: 'test' } } },
      error: null,
    })),
    getSession: jest.fn(() => Promise.resolve({
      data: { session: { user: { id: 'test-uid', email: 'test@example.com', user_metadata: { display_name: 'test' } } } },
      error: null,
    })),
    onAuthStateChange: jest.fn((cb) => {
      cb('SIGNED_IN', { user: { id: 'test-uid', email: 'test@example.com', user_metadata: { display_name: 'test' } } });
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
    signInWithPassword: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    updateUser: jest.fn(() => Promise.resolve({ error: null })),
  },
  from: jest.fn(() => mockQuery),
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })),
    })),
  },
};
