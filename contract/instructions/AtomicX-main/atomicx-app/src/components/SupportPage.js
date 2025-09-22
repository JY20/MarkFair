import React from 'react';
import './SupportPage.css';

function SupportPage() {
  return (
    <div className="support-page">
      <div className="support-container">
        <div className="support-header">
          <h1>Support & FAQ</h1>
          <p>Get help with AtomicX cross-chain swaps</p>
        </div>
        
        <div className="support-content">
          <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            
            <div className="faq-item">
              <h3>What is AtomicX?</h3>
              <p>AtomicX is a decentralized platform that enables secure cross-chain swaps between Ethereum (ETH) and Starknet (STRK) tokens using atomic transactions.</p>
            </div>
            
            <div className="faq-item">
              <h3>How do atomic swaps work?</h3>
              <p>Atomic swaps use Hash Time-Locked Contracts (HTLCs) to ensure that either both parties receive their tokens or neither does, eliminating the need for trusted intermediaries.</p>
            </div>
            
            <div className="faq-item">
              <h3>Which wallets are supported?</h3>
              <p>We support MetaMask for Ethereum and ArgentX for Starknet. Make sure you have both wallets installed and connected to perform cross-chain swaps.</p>
            </div>
            
            <div className="faq-item">
              <h3>What are the fees?</h3>
              <p>Fees include gas costs for both Ethereum and Starknet networks, plus a small platform fee. All fees are transparently displayed before you confirm the swap.</p>
            </div>
            
            <div className="faq-item">
              <h3>How long do swaps take?</h3>
              <p>Most swaps complete within 2-5 minutes, depending on network congestion. The process involves transactions on both Ethereum and Starknet networks.</p>
            </div>
            
            <div className="faq-item">
              <h3>What if my swap fails?</h3>
              <p>If a swap fails, your funds are automatically returned to your wallet. No funds are lost in failed transactions due to the atomic nature of the swaps.</p>
            </div>
          </div>
          
          <div className="contact-section">
            <h2>Need More Help?</h2>
            <div className="contact-methods">
              <div className="contact-method">
                <h3>📧 Email Support</h3>
                <p>support@atomicx.com</p>
              </div>
              <div className="contact-method">
                <h3>💬 Discord</h3>
                <p>Join our community for real-time support</p>
              </div>
              <div className="contact-method">
                <h3>📖 Documentation</h3>
                <p>Read our comprehensive guides</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportPage; 