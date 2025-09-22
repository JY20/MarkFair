import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useWallet } from '../contexts/WalletContext';
import logo from '../logo.png';

function Navbar() {
  const {
    ethAccount,
    starknetAccount,
    connecting,
    showEthDropdown,
    showStarknetDropdown,
    connectEthWallet,
    connectStarknetWallet,
    disconnectEthWallet,
    disconnectStarknetWallet,
    formatAddress,
    setShowEthDropdown,
    setShowStarknetDropdown,
    ethBalance,
    starknetBalance
  } = useWallet();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="AtomicX Logo" className="navbar-logo-img" />
          <span>AtomicX</span>
        </Link>
        
        <div className="nav-menu">
          <Link to="/#features" className="nav-link">Features</Link>
          <Link to="/swap" className="nav-link">Swap</Link>
          <Link to="/support" className="nav-link">Support</Link>
        </div>
        
        <div className="nav-actions">
          <div className="wallet-container">
            {!ethAccount ? (
              <>
                <button 
                  className="wallet-button"
                  onClick={() => setShowEthDropdown(!showEthDropdown)}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect ETH Wallet'}
                </button>
                <div className={`wallet-dropdown ${showEthDropdown ? 'show' : ''}`}>
                  <button onClick={connectEthWallet} className="wallet-option">
                    <span className="wallet-icon eth">ETH</span>
                    MetaMask
                  </button>
                  <button onClick={connectEthWallet} className="wallet-option">
                    <span className="wallet-icon eth">ETH</span>
                    WalletConnect
                  </button>
                </div>
              </>
            ) : (
              <div className="wallet-info">
                <div className="wallet-type">ETH</div>
                <div className="wallet-details">
                  <div className="wallet-address">{formatAddress(ethAccount)}</div>
                  <div className="wallet-balance">{parseFloat(ethBalance).toFixed(4)} ETH</div>
                  <div className="wallet-network">Sepolia Testnet</div>
                </div>
                <button className="disconnect-btn" onClick={disconnectEthWallet}>
                  Disconnect
                </button>
              </div>
            )}
          </div>

          <div className="wallet-container">
            {!starknetAccount ? (
              <>
                <button 
                  className="wallet-button"
                  onClick={() => setShowStarknetDropdown(!showStarknetDropdown)}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect Starknet Wallet'}
                </button>
                <div className={`wallet-dropdown ${showStarknetDropdown ? 'show' : ''}`}>
                  <button onClick={connectStarknetWallet} className="wallet-option">
                    <span className="wallet-icon strk">STRK</span>
                    ArgentX
                  </button>
                  <button onClick={connectStarknetWallet} className="wallet-option">
                    <span className="wallet-icon strk">STRK</span>
                    Braavos
                  </button>
                </div>
              </>
            ) : (
              <div className="wallet-info">
                <div className="wallet-type">STRK</div>
                <div className="wallet-details">
                  <div className="wallet-address">{formatAddress(starknetAccount?.address)}</div>
                  <div className="wallet-balance">{parseFloat(starknetBalance).toFixed(4)} STRK</div>
                  <div className="wallet-network">StarkNet Sepolia</div>
                </div>
                <button className="disconnect-btn" onClick={disconnectStarknetWallet}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 