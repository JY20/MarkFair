export interface User {
  id: string;
  address: string;
  role: 'advertiser' | 'kol';
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  platform: 'youtube';
  requirements: string[];
  isAuction: boolean;
  duration: number; // days
  budget: number; // in STRK tokens
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  advertiserId: string;
  kolId?: string;
  createdAt: Date;
  deadline: Date;
}

export interface Platform {
  id: string;
  name: string;
  type: 'youtube';
  connected: boolean;
  accountId?: string;
  accountName?: string;
  followers?: number;
}

export interface WalletConnection {
  address: string;
  balance: number;
  connected: boolean;
}

export interface AuthState {
  user: User | null;
  wallet: WalletConnection | null;
  isAuthenticated: boolean;
  loading: boolean;
}