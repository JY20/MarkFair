import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  List, 
  BarChart3, 
  Wallet, 
  Settings,
  Users,
  Eye,
  DollarSign,
  Youtube
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdvertiser = user?.role === 'advertiser';

  const advertiserMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Plus, label: 'Create Task', path: '/tasks/create' },
    { icon: List, label: 'My Tasks', path: '/tasks/my-tasks' },
    // { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    // { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const kolMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Eye, label: 'Task Hall', path: '/tasks' },
    { icon: List, label: 'My Tasks', path: '/tasks/my-tasks' },
    { icon: Youtube, label: 'YouTube Account', path: '/youtube-connect' },
    // { icon: DollarSign, label: 'Earnings', path: '/earnings' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const menuItems = isAdvertiser ? advertiserMenuItems : kolMenuItems;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-gray-800/50 border-r border-gray-700 min-h-screen">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">
            {isAdvertiser ? 'Advertiser Panel' : 'KOL Panel'}
          </h2>
          <p className="text-sm text-gray-400">
            {user?.username}
          </p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}