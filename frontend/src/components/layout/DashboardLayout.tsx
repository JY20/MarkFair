import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { WalletConnector } from '../WalletConnector';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [showWalletConnector, setShowWalletConnector] = useState(false);
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onOpenWallet={() => setShowWalletConnector(true)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <WalletConnector isOpen={showWalletConnector} onClose={() => setShowWalletConnector(false)} />
    </div>
  );
}