import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignInButton, SignOutButton, useUser } from '@clerk/clerk-react';
import { Wallet, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStarknet } from '../../hooks/useStarknet';
 
interface HeaderProps {
  onOpenWallet?: () => void;
}

export function Header({ onOpenWallet }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { isSignedIn } = useUser();
  const { isConnected, address, connectWallet, disconnectWallet } = useStarknet();
  const navigate = useNavigate();
  

  const handleWalletAction = async () => {
    if (isConnected) {
      await disconnectWallet();
    } else {
      onOpenWallet && onOpenWallet();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/markfair-logo.png" alt="MarkFair" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-500 bg-clip-text text-transparent">
              MarkFair
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                {user?.role === 'advertiser' ? (
                  <Link
                    to="/tasks/create"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Create Task
                  </Link>
                ) : (
                  <Link
                    to="/tasks"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Browse Tasks
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Profile
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">

            {/* Wallet Connection */}
            <button
              onClick={handleWalletAction}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isConnected
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'bg-primary-600/20 text-primary-400 border border-primary-500/30 hover:bg-primary-600/30'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span className="text-sm">
                {isConnected ? formatAddress(address!) : 'Connect Wallet'}
              </span>
            </button>

            {/* User Menu */}
            {isSignedIn ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                  </div>
                </div>
                <SignOutButton>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <LogOut className="h-5 w-5" />
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                    Login
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all">
                    Get Started
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Connector Modal is now controlled and rendered in Home */}
    </header>
  );
}