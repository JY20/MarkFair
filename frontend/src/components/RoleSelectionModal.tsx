import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, X } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'advertiser' | 'kol') => void;
}

export function RoleSelectionModal({ isOpen, onClose, onSelectRole }: RoleSelectionModalProps) {
  const handleRoleSelect = (role: 'advertiser' | 'kol') => {
    // Save role selection to localStorage
    localStorage.setItem('userRole', role);
    onSelectRole(role);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-2xl w-full relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Choose Your Role</h2>
              <p className="text-gray-400">
                Select how you want to use AdForge platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Advertiser Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('advertiser')}
                className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 hover:border-primary-500/50 cursor-pointer transition-all group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Advertiser</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Create and manage advertising campaigns to reach your target audience
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Create advertising tasks</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Connect with KOLs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Track campaign performance</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>Manage budgets and payments</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* KOL Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('kol')}
                className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 hover:border-secondary-500/50 cursor-pointer transition-all group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">KOL (Key Opinion Leader)</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Find and participate in advertising tasks to monetize your content
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>Browse available tasks</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>Apply for campaigns</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>Complete tasks and earn</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>Connect YouTube channel</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                You can change your role later in settings
              </p>
            </div>
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
