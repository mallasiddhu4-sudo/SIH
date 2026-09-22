import React, { createContext, useContext, useState, useEffect } from 'react';
import { FarmerProfile } from '../types';
import { DEFAULT_MOCK_FARMER } from '../data/mockFarmerData';

interface AuthContextType {
  farmer: FarmerProfile | null;
  isAuthenticated: boolean;
  login: (phone: string, pin: string) => boolean;
  demoLogin: () => void;
  register: (profile: Omit<FarmerProfile, 'id' | 'farmerId'>) => FarmerProfile;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'farmer_portal_auth_user';
const REGISTERED_FARMERS_KEY = 'farmer_portal_registered_farmers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [registeredFarmers, setRegisteredFarmers] = useState<FarmerProfile[]>(() => {
    const saved = localStorage.getItem(REGISTERED_FARMERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [DEFAULT_MOCK_FARMER];
      }
    }
    return [DEFAULT_MOCK_FARMER];
  });

  useEffect(() => {
    if (farmer) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(farmer));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [farmer]);

  const login = (phone: string, _pin: string): boolean => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) return false;

    // Check registered or default mock
    const found = registeredFarmers.find(f => f.phone.replace(/\D/g, '') === cleanPhone);
    if (found) {
      setFarmer(found);
      return true;
    }

    // If logging in with 9876543210
    if (cleanPhone === '9876543210') {
      setFarmer(DEFAULT_MOCK_FARMER);
      return true;
    }

    // Auto-create a temporary mock profile if unknown phone for easy testing
    const newProfile: FarmerProfile = {
      id: 'farmer_' + Math.random().toString(36).substring(7),
      name: 'Farmer ' + cleanPhone.slice(-4),
      phone: cleanPhone,
      farmerId: 'AP-KRN-2024-' + cleanPhone.slice(-4),
      village: 'Rampur',
      district: 'Kurnool',
      bankAccountMasked: '•••• •••• ' + cleanPhone.slice(-4),
      bankName: 'State Bank of India',
      ifscMasked: 'SBIN000••••'
    };
    setFarmer(newProfile);
    setRegisteredFarmers(prev => [...prev, newProfile]);
    return true;
  };

  const demoLogin = () => {
    setFarmer(DEFAULT_MOCK_FARMER);
  };

  const register = (profile: Omit<FarmerProfile, 'id' | 'farmerId'>): FarmerProfile => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const newFarmer: FarmerProfile = {
      ...profile,
      id: 'farmer_' + randomSuffix,
      farmerId: `AP-${profile.district.slice(0, 3).toUpperCase()}-2024-${randomSuffix}`
    };

    const updated = [...registeredFarmers, newFarmer];
    setRegisteredFarmers(updated);
    localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(updated));
    setFarmer(newFarmer);
    return newFarmer;
  };

  const logout = () => {
    setFarmer(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        farmer,
        isAuthenticated: !!farmer,
        login,
        demoLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
