import React from 'react';
import './AtomicSwap.css';

const AtomicSwap = () => {
  return (
    <section className="atomic-swap">
      <div className="section-container">
        <h2>Atomic Swap</h2>
        <h3>How It Works</h3>
        
        <div className="swap-process">
          <div className="user-flow maker">
            <h4>User A [MAKER]:</h4>
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <p>Try to run a transaction</p>
                <p>Chooses between ETH &lt;&gt; STRK</p>
                <p className="highlight">Example: ETH &gt; STRK</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <p>An order is created with:</p>
                <ul>
                  <li>Order ID</li>
                  <li>Hash locked ID</li>
                  <li>Order details</li>
                </ul>
                <p className="highlight">Amount: 0.1 Sepolia ETH &gt; 300 Testnet STRK</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <p>A HTLC contract is created by the maker</p>
                <p>An automatic deposit contract vault is created to lock user's Sepolia ETH</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <p>A secret key for User B (TAKER) to be able to claim funds is generated</p>
              </div>
            </div>
          </div>
          
          <div className="swap-divider">
            <div className="divider-line"></div>
            <div className="swap-icon">⇄</div>
            <div className="divider-line"></div>
          </div>
          
          <div className="user-flow taker">
            <h4>User B [TAKER]:</h4>
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <p>Confirms transaction and offers to swap 2,600 STRK for 0.1 Sepolia ETH</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <p>An order is created with:</p>
                <ul>
                  <li>Order ID</li>
                  <li>Hash locked ID</li>
                  <li>All necessary details</li>
                </ul>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <p>A HTLC contract is automatically generated using Cairo</p>
                <p>2,600 STRK is deposited into the contract on StarkNet Sepolia</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <p>User A reveals the secret after confirming deposits</p>
                <p>Both users' funds are released upon completion</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="fallback-scenario">
          <h4>Fallback Scenario:</h4>
          <p>If either user fails to fulfill the agreement, the transaction is canceled and funds are returned to their original owners.</p>
        </div>
        
        <div className="architecture">
          <h3>Project Architecture</h3>
          <div className="architecture-content">
            <div className="architecture-section">
              <h4>A. Smart Contracts</h4>
              <ul>
                <li><strong>Ethereum Contract:</strong> Handles locking, claiming, and refunding Sepolia ETH using hashlock and timelock logic.</li>
                <li><strong>Starknet Contract:</strong> Handles locking, claiming, and refunding STRK using the same logic, but written in Cairo.</li>
              </ul>
            </div>
            
            <div className="architecture-section">
              <h4>B. Relayer Service</h4>
              <ul>
                <li>Watches both blockchains for swap events.</li>
                <li>Generates and manages secrets for hashlocks.</li>
                <li>Sends messages between Sepolia and StarkNet Sepolia (using a bridge or messaging protocol).</li>
                <li>Ensures atomicity: either both sides of the swap happen, or neither does.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AtomicSwap; 