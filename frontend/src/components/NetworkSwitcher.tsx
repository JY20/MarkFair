import React from 'react';
import { useNetwork, useAccount } from '@starknet-react/core';
import { mainnet, sepolia } from '@starknet-react/chains';
import { motion } from 'framer-motion';
import { ChevronDown, Globe } from 'lucide-react';

const networks = [
  { chain: sepolia, name: 'Sepolia Testnet', color: 'text-orange-400' },
  { chain: mainnet, name: 'Mainnet', color: 'text-green-400' },
];

export function NetworkSwitcher() {
  const { chain } = useNetwork();
  const { account } = useAccount();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentNetwork = networks.find(n => n.chain.id === chain?.id) || networks[0];

  const handleNetworkSwitch = async (targetChain: typeof mainnet | typeof sepolia) => {
    try {
      if (!account) {
        alert('Please connect your wallet first');
        setIsOpen(false);
        return;
      }

      // Try to switch network using the wallet's API
      if ((window as any).starknet) {
        try {
          await (window as any).starknet.request({
            method: 'wallet_switchStarknetChain',
            params: {
              chainId: targetChain.id,
            },
          });
          setIsOpen(false);
        } catch (error: any) {
          // If the chain is not added to the wallet, try to add it
          if (error.code === 4902) {
            try {
              await (window as any).starknet.request({
                method: 'wallet_addStarknetChain',
                params: {
                  chainId: targetChain.id,
                  chainName: targetChain.name,
                  rpcUrls: [targetChain.id.toString() === '0x534e5f5345504f4c4941' ? 'https://starknet-sepolia.public.blastapi.io' : 'https://starknet-mainnet.public.blastapi.io'],
                },
              });
              setIsOpen(false);
            } catch (addError) {
              console.error('Failed to add chain:', addError);
              alert(`Failed to add ${targetChain.name} to your wallet. Please add it manually.`);
            }
          } else {
            console.error('Failed to switch network:', error);
            alert(`Failed to switch to ${targetChain.name}. Please switch networks in your wallet.`);
          }
        }
      } else {
        alert(`Please switch to ${targetChain.name} in your wallet settings.`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert(`Failed to switch to ${targetChain.name}. Please switch networks in your wallet.`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-all"
      >
        <Globe className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-300">{currentNetwork.name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50"
        >
          <div className="p-2">
            {networks.map((network) => (
              <button
                key={network.chain.id}
                onClick={() => handleNetworkSwitch(network.chain)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors flex items-center space-x-3 ${
                  chain?.id === network.chain.id ? 'bg-gray-700/30' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${network.color.replace('text-', 'bg-')}`} />
                <span className="text-sm text-gray-300">{network.name}</span>
                {chain?.id === network.chain.id && (
                  <span className="ml-auto text-xs text-green-400">●</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
