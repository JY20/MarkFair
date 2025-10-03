import React from 'react';
import { StarknetConfig, publicProvider } from '@starknet-react/core';
import { mainnet, sepolia } from '@starknet-react/chains';
import { ready } from "@starknet-react/core";

// Enable any injected wallet (ArgentX, Braavos, Ready, etc.)
const connectors = [
  ready()
];

// Select network via code (env or simple toggle)
const selectedChain = (() => {
  const envNetwork = (import.meta as any).env?.VITE_STARKNET_NETWORK as string | undefined;
  if ((envNetwork || '').toLowerCase() === 'mainnet') {
    return mainnet;
  }
  // default to sepolia testnet
  return sepolia;
})();

interface StarknetProviderProps {
  children: React.ReactNode;
}

export function StarknetProvider({ children }: StarknetProviderProps) {
  return (
    <StarknetConfig
      chains={[selectedChain]}
      provider={publicProvider()}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
}
