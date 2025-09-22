import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>AtomicX</h3>
          <p>A powerful platform for atomic swaps and cross-chain transactions.</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AtomicX. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer; 