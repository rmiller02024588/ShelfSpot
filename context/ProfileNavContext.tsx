import { createContext, useContext } from 'react';

type ProfileNavContextType = {
  onViewProfile: (userId: string) => void;
};

export const ProfileNavContext = createContext<ProfileNavContextType>({
  onViewProfile: () => {},
});

export const useProfileNav = () => useContext(ProfileNavContext);
