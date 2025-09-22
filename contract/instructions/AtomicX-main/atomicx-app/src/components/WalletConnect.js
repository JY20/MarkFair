import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { connect } from 'get-starknet';
import './WalletConnect.css';

const WalletConnect = () => {
  const [ethAccount, setEthAccount] = useState(null);
  const [starknetAccount, setStarknetAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeWallet, setActiveWallet] = useState(null); // 'ethereum' or 'starknet'
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Check if wallets are already connected
    const checkConnectedWallets = async () => {
      // Check Ethereum wallet
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setEthAccount(accounts[0]);
          setActiveWallet('ethereum');
        }
      }

      // Check Starknet wallet
      try {
        const starknet = await connect();
        if (starknet && starknet.isConnected) {
          setStarknetAccount(starknet.account);
          setActiveWallet('starknet');
        }
      } catch (error) {
        console.error("Error checking Starknet connection:", error);
      }
    };

    checkConnectedWallets();
  }, []);

  const connectEthereumWallet = async () => {
    if (window.ethereum) {
      try {
        setConnecting(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setEthAccount(accounts[0]);
        setActiveWallet('ethereum');
        setShowDropdown(false);
      } catch (error) {
        console.error("Error connecting to Ethereum wallet:", error);
      } finally {
        setConnecting(false);
      }
    } else {
      alert("Please install MetaMask or another Ethereum wallet");
    }
  };

  const connectStarknetWallet = async () => {
    try {
      setConnecting(true);
      const starknet = await connect();
      if (!starknet) {
        alert("Please install a Starknet wallet like ArgentX");
        return;
      }
      
      await starknet.enable();
      setStarknetAccount(starknet.account);
      setActiveWallet('starknet');
      setShowDropdown(false);
    } catch (error) {
      console.error("Error connecting to Starknet wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setEthAccount(null);
    setStarknetAccount(null);
    setActiveWallet(null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="wallet-connect">
      {!activeWallet ? (
        <div className="wallet-buttons">
          <button 
            className="connect-wallet-btn"
            onClick={toggleDropdown}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <div className={`wallet-dropdown ${showDropdown ? 'show' : ''}`}>
            <button onClick={connectEthereumWallet} className="wallet-option">
              <span className="wallet-icon eth">ETH</span>
              Ethereum
            </button>
            <button onClick={connectStarknetWallet} className="wallet-option">
              <span className="wallet-icon strk">STRK</span>
              Starknet
            </button>
          </div>
        </div>
      ) : (
        <div className="wallet-info">
          <div className="wallet-type">
            {activeWallet === 'ethereum' ? 'ETH' : 'STRK'}
          </div>
          <div className="wallet-address">
            {activeWallet === 'ethereum' 
              ? formatAddress(ethAccount)
              : formatAddress(starknetAccount?.address)}
          </div>
          <button className="disconnect-btn" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 