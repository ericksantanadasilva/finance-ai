'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile } from '@/app/_actions/settings';

interface User {
  name: string;
  email: string | undefined;
  image: string | null;
}

interface UserContextType {
  user: User | null;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    const profile = await getUserProfile();
    if (profile) setUser(profile);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  return context;
};
