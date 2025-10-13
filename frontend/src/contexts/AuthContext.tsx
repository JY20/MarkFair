import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AuthState, User, WalletConnection } from '../types';

interface AuthContextType extends AuthState {
  connectWallet: (wallet: WalletConnection) => void;
  disconnectWallet: () => void;
  updateUser: (userData: Partial<User>) => void;
  setUserRole: (role: 'advertiser' | 'kol') => void;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'CONNECT_WALLET'; payload: WalletConnection }
  | { type: 'DISCONNECT_WALLET' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER_ROLE'; payload: 'advertiser' | 'kol' };

const initialState: AuthState = {
  user: null,
  wallet: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    case 'CONNECT_WALLET':
      return {
        ...state,
        wallet: action.payload,
        loading: false,
      };
    case 'DISCONNECT_WALLET':
      return {
        ...state,
        wallet: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_USER_ROLE':
      return {
        ...state,
        user: state.user ? { ...state.user, role: action.payload } : null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { user: clerkUser, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    
    const savedWallet = localStorage.getItem('wallet');
    const savedRole = localStorage.getItem('userRole') as 'advertiser' | 'kol' | null;
    
    if (clerkUser) {
      
      // Convert Clerk user to our User type
      const userData: User = {
        id: clerkUser.id,
        address: '', // Will be set when wallet is connected
        role: savedRole || 'advertiser', // Use saved role or default to advertiser
        username: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatar: clerkUser.imageUrl,
        createdAt: new Date(clerkUser.createdAt || Date.now()),
      };
      
      try {
        const wallet = savedWallet ? JSON.parse(savedWallet) : undefined;
        dispatch({ type: 'SET_USER', payload: userData });
        if (wallet) {
          dispatch({ type: 'CONNECT_WALLET', payload: wallet });
        }
      } catch (error) {
        console.error('Error parsing saved wallet data:', error);
      }
    } else {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, [clerkUser, isLoaded]);

  const connectWallet = (wallet: WalletConnection) => {
    localStorage.setItem('wallet', JSON.stringify(wallet));
    dispatch({ type: 'CONNECT_WALLET', payload: wallet });
  };

  const disconnectWallet = () => {
    localStorage.removeItem('wallet');
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      dispatch({ type: 'UPDATE_USER', payload: userData });
    }
  };

  const setUserRole = (role: 'advertiser' | 'kol') => {
    localStorage.setItem('userRole', role);
    dispatch({ type: 'SET_USER_ROLE', payload: role });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        connectWallet,
        disconnectWallet,
        updateUser,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}