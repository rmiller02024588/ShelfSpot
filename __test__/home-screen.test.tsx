import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('<HomeScreen />', () => {
  test('Bottom nav renders properly', () => {
    const { getByText } = render(<HomeScreen />);

    getByText('Home Screen');
  });
});
