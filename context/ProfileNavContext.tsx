import { createContext, useContext } from 'react';

type ProfileNavContextType = {
  onViewProfile: (email: string) => void;
};

export const ProfileNavContext = createContext<ProfileNavContextType>({
  onViewProfile: () => {},
});

export const useProfileNav = () => useContext(ProfileNavContext);
