import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStarknet } from '../hooks/useStarknet';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, X, ExternalLink } from 'lucide-react';

interface WalletConnectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnector({ isOpen, onClose }: WalletConnectorProps) {
  const { connectWallet, availableConnectors, isConnecting, isConnected, address } = useStarknet();
  const { connectWallet: authConnectWallet } = useAuth();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (connectorId: string) => {
    try {
      setConnectingId(connectorId);
      await connectWallet(connectorId);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnectingId(null);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      authConnectWallet({ address, balance: 1000, connected: true });
      onClose();
    }
  }, [isConnected, address]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
              <p className="text-gray-400">
                Choose a wallet to connect to AdForge
              </p>
            </div>

            <div className="space-y-3">
              {availableConnectors.map((connector) => (
                <motion.button
                  key={connector.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConnect(connector.id)}
                  disabled={isConnecting || connectingId === connector.id}
                  className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold">{connector.name}</h3>
                      <p className="text-sm text-gray-400">Ready to connect</p>
                    </div>
                    {connectingId === connector.id && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <ExternalLink className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium text-sm">Supported Wallets</p>
                  <p className="text-blue-300/80 text-xs mt-1">
                    Only ready wallets are supported. Make sure you have the wallet extension installed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
