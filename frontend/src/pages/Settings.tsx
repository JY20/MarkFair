import React from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { User, Mail, LogOut } from 'lucide-react';

export function Settings() {
  const { user } = useUser();
  console.log(user)

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 max-w-2xl mx-auto">
        <div className="flex items-center space-x-6">
          <img 
            src={user.imageUrl} 
            alt={user.fullName || 'User avatar'} 
            className="w-24 h-24 rounded-full border-4 border-primary-500"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.fullName}</h2>
            <p className="text-gray-400">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-4" />
            <span>UserID: {user.id}</span>
          </div>
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-400 mr-4" />
            <span>Primary Email: {user.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6">
          <SignOutButton>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all">
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}