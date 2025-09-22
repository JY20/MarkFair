import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SwapPage from './components/SwapPage';
import SupportPage from './components/SupportPage';
import { WalletProvider } from './contexts/WalletContext';

function HomePage() {
  const navigate = useNavigate();

  const handleSwapClick = () => {
    navigate('/swap');
  };

  const handleLearnMoreClick = () => {
    // Scroll to features section
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Hero Section */}
      <section style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
        <div style={{ flex: 1, color: '#ffffff', paddingRight: '2rem', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '1.5rem', fontFamily: 'Space Grotesk, sans-serif', lineHeight: '1.2', marginTop: 0, textAlign: 'left' }}>
            <span style={{ color: '#ffffff' }}>The Ultimate<br /></span>
            <span style={{ color: '#87ceeb' }}>Decentralized<br /></span>
            <span style={{ color: '#87ceeb' }}>Swap Aggregator</span>
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, fontFamily: 'Space Grotesk, sans-serif', lineHeight: '1.6', margin: '0 0 2rem 0', textAlign: 'left' }}>
            AtomicX is your gateway to secure cross-chain transactions. Effortlessly swap between Ethereum and Starknet with atomic transactions ensuring security, speed, and transparency.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={handleSwapClick}
              style={{
                background: '#a855f7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#9333ea';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#a855f7';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Swap
            </button>
            <button 
              onClick={handleLearnMoreClick}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Space Grotesk, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Learn More
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src="/hero.png" 
            alt="AtomicX Hero" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              maxHeight: '80vh'
            }} 
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 2rem', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ 
              display: 'inline-block', 
              background: '#f3e8ff', 
              color: '#a855f7', 
              padding: '0.5rem 1.5rem', 
              borderRadius: '20px', 
              fontSize: '0.9rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              fontFamily: 'Space Grotesk, sans-serif'
            }}>
              Features
            </div>
            <h2 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              margin: '0', 
              color: '#a855f7', 
              fontFamily: 'Space Grotesk, sans-serif',
              lineHeight: '1.2'
            }}>
              The Atomic Swap Platform with<br />Limitless Potential
            </h2>
          </div>

          {/* Feature Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
            {/* Card 1: 100% Cross-Chain Compatible */}
            <div style={{ 
              background: '#ffffff', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  background: '#a855f7',
                  borderRadius: '50%'
                }}></div>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#111827', fontFamily: 'Space Grotesk, sans-serif' }}>
                100% Cross-Chain Compatible
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem' }}>
                Use the existing Ethereum and Starknet ecosystems to your advantage with seamless atomic swaps.
              </p>
            </div>

            {/* Card 2: 5-Minute Settlement */}
            <div style={{ 
              background: '#ffffff', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#111827', fontFamily: 'Space Grotesk, sans-serif' }}>
                Minute Settlement
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem' }}>
                Incredibly fast <u>atomic swap</u> completion creates a seamless user experience.
              </p>
            </div>

            {/* Card 3: 1s HTLC Finality */}
            <div style={{ 
              background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', 
              padding: '2rem', 
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                pointerEvents: 'none'
              }}></div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif', position: 'relative', zIndex: 1 }}>
                1min HTLC Finality
              </h3>
            </div>
          </div>

          {/* Second Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
            {/* Card 4: 0 Gas Fees */}
            <div style={{ 
              background: '#ffffff', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                $0
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#111827', fontFamily: 'Space Grotesk, sans-serif' }}>
                Platform Fees
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem' }}>
                Allows for extreme scalability for the most demanding DeFi applications.
              </p>
            </div>

            {/* Card 5: 0.5 Second Block Times */}
            <div style={{ 
              background: '#ffffff', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                60
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#111827', fontFamily: 'Space Grotesk, sans-serif' }}>
                Second Block Times
              </h3>
            </div>
          </div>

          {/* Bottom Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', alignItems: 'center' }}>
            {/* Large Card: Low Hardware Requirements */}
            <div style={{ 
              background: '#ffffff', 
              padding: '3rem', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                borderRadius: '50%',
                opacity: '0.1'
              }}></div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827', fontFamily: 'Space Grotesk, sans-serif' }}>
                Advanced HTLC Technology
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.7', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem' }}>
                AtomicX uses Hash Time-Locked Contracts (HTLCs) to ensure secure cross-chain transactions. This technology guarantees that either both parties receive their tokens or neither does, eliminating the need for trusted intermediaries and creating a clear path to decentralized atomic swaps.
              </p>
            </div>

            {/* Call to Action */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ 
                color: '#111827', 
                fontSize: '1.2rem', 
                fontWeight: '600', 
                marginBottom: '2rem',
                fontFamily: 'Space Grotesk, sans-serif',
                lineHeight: '1.5'
              }}>
                Start swapping on the most secure cross-chain platform.
              </p>
              <button 
                onClick={handleSwapClick}
                style={{
                  background: '#a855f7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Space Grotesk, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#9333ea';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#a855f7';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ⚡ Start Swapping
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
