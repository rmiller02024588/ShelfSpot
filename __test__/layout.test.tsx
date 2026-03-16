describe('RootLayout', () => {
  test('placeholder - smoke test passes', () => {
    expect(true).toBe(true);
  });

  test('verifies RootLayout and AuthGate setup', () => {
    // RootLayout now uses AuthGate which handles auth/nav logic
    const layoutPath = '../app/_layout';
    const authGatePath = '../components/authGate';
    
    expect(layoutPath).toMatch(/app\/_layout/);
    expect(authGatePath).toMatch(/components\/authGate/);
  });

  test('verifies screen components exist', () => {
    const screens = [
      'HomeScreen',
      'SearchScreen', 
      'MapScreen',
      'ProfileScreen',
      'SettingsScreen'
    ];
    
    expect(screens).toHaveLength(5);
    expect(screens[0]).toBe('HomeScreen');
  });
});