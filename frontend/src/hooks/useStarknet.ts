import { useAccount, useConnect, useDisconnect, useNetwork } from '@starknet-react/core';
import { useMemo } from 'react';

export function useStarknet() {
  const { account, address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const connectWallet = async (connectorId?: string) => {
    try {
      if (connectorId) {
        const connector = connectors.find(c => c.id === connectorId);
        if (connector) {
          console.log('connector', connector);
          await connect({ connector });
        }
      } else {
        // If no connector specified, use the first available one
        if (connectors.length > 0) {
          await connect({ connector: connectors[0] });
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const getBalance = async (_tokenAddress: string): Promise<number> => {
    if (!account) return 0;

    try {
      // This would be implemented with the actual token contract call
      // For now, returning a mock balance
      return 1000;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  };

  const availableConnectors = useMemo(() => {
    return connectors.map(connector => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
    }));
  }, [connectors]);

  return {
    account,
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    getBalance,
    chain,
    availableConnectors,
  };
}