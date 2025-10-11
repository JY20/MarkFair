import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Shield, Users, ArrowRight, CheckCircle, TrendingUp, Wallet, Youtube as YouTube } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { WalletConnector } from '../components/WalletConnector';

export function Home() {
  const { isSignedIn } = useUser();
  const [showWalletConnector, setShowWalletConnector] = useState(false);

  // Redirect to dashboard if already signed in
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: Shield,
      title: 'Decentralized & Secure',
      description: 'Built on Starknet for maximum security and transparency'
    },
    {
      icon: Users,
      title: 'Connect KOLs & Brands',
      description: 'Direct connection between content creators and advertisers'
    },
    {
      icon: TrendingUp,
      title: 'Performance Driven',
      description: 'Track real performance metrics and ROI in real-time'
    },
    {
      icon: Wallet,
      title: 'Instant Payments',
      description: 'Automated smart contract payments on task completion'
    }
  ];

  const stats = [
    { label: 'Active KOLs', value: '10K+' },
    { label: 'Campaigns Launched', value: '5K+' },
    { label: 'Total Volume', value: '$2M+' },
    { label: 'Success Rate', value: '95%' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onOpenWallet={() => setShowWalletConnector(true)} />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary-400 via-secondary-500 to-accent-400 bg-clip-text text-transparent">
                  Web3 Advertising
                </span>
                <br />
                <span className="text-white">Revolutionized</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Connect advertisers with KOLs in a decentralized ecosystem. 
                Transparent, secure, and powered by Starknet blockchain technology.
              </p>
              
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Instant payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>100% transparent</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Why Choose MarkFair?
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Experience the next generation of digital advertising with blockchain security and transparency
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-gray-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                How MarkFair Works
              </h2>
              <p className="text-xl text-gray-400">
                Simple, transparent, and efficient
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* For Advertisers */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gray-800/50 p-8 rounded-xl border border-gray-700"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  For Advertisers
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Create Campaign</h4>
                      <p className="text-gray-400">Define your requirements, budget, and target audience</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Connect Wallet</h4>
                      <p className="text-gray-400">Fund your campaign with STRK tokens</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Track & Pay</h4>
                      <p className="text-gray-400">Monitor performance and automatic payments</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* For KOLs */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gray-800/50 p-8 rounded-xl border border-gray-700"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  For KOLs
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Browse Tasks</h4>
                      <p className="text-gray-400">Find campaigns that match your audience</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Connect Platforms</h4>
                      <p className="text-gray-400">Link your YouTube channel for verification</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Complete & Earn</h4>
                      <p className="text-gray-400">Deliver content and receive instant payments</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Platform Support */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-8">Supported Platforms</h3>
            <div className="flex justify-center">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
                <YouTube className="h-8 w-8 text-red-500" />
                <span className="text-white font-semibold">YouTube</span>
                <span className="text-sm text-gray-400">(More platforms coming soon)</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Transform Your Advertising?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of advertisers and KOLs already using MarkFair
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register?type=advertiser"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all"
                >
                  Start as Advertiser
                </Link>
                <Link
                  to="/register?type=kol"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all"
                >
                  Join as KOL
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <WalletConnector isOpen={showWalletConnector} onClose={() => setShowWalletConnector(false)} />
      <Footer />
    </div>
  );
}