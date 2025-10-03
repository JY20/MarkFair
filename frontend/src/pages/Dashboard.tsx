import React from 'react';
import { motion } from 'framer-motion';
import {
  Youtube,
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Plus,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  console.log('user', user);
  const isAdvertiser = user?.role === 'advertiser';

  // Mock data
  const stats = isAdvertiser ? [
    { label: 'Active Campaigns', value: '12', icon: TrendingUp, change: '+2 from last month' },
    { label: 'Total Spent', value: '$24,580', icon: DollarSign, change: '+15% from last month' },
    { label: 'KOLs Reached', value: '156', icon: Users, change: '+23 this month' },
    { label: 'Avg. Completion', value: '94%', icon: CheckCircle, change: '+5% improvement' },
  ] : [
    { label: 'Completed Tasks', value: '28', icon: CheckCircle, change: '+4 this month' },
    { label: 'Total Earned', value: '$3,420', icon: DollarSign, change: '+18% from last month' },
    { label: 'Active Tasks', value: '6', icon: Clock, change: '2 due this week' },
    { label: 'Success Rate', value: '96%', icon: TrendingUp, change: 'Excellent performance' },
  ];

  const recentTasks = isAdvertiser ? [
    {
      id: '1',
      title: 'Tech Product Review Campaign',
      status: 'active',
      applications: 23,
      budget: '$2,400'
    },
    {
      id: '2', 
      title: 'Gaming Channel Sponsorship',
      status: 'completed',
      applications: 45,
      budget: '$5,600'
    },
    {
      id: '3',
      title: 'Fitness App Promotion',
      status: 'draft',
      applications: 0,
      budget: '$1,800'
    }
  ] : [
    {
      id: '1',
      title: 'Tech Product Review Campaign',
      status: 'in_progress',
      deadline: '2024-01-15',
      payment: '$400'
    },
    {
      id: '2',
      title: 'Gaming Channel Sponsorship', 
      status: 'completed',
      deadline: '2024-01-10',
      payment: '$600'
    },
    {
      id: '3',
      title: 'Fitness App Promotion',
      status: 'pending',
      deadline: '2024-01-20',
      payment: '$300'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10';
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'draft':
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-gray-400">
                {isAdvertiser 
                  ? "Monitor your campaigns and track performance"
                  : "Check your active tasks and earnings"
                }
              </p>
            </div>
            <Link
              to={isAdvertiser ? "/tasks/create" : "/tasks"}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>{isAdvertiser ? "Create Task" : "Browse Tasks"}</span>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800/50 rounded-xl border border-gray-700"
        >
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {isAdvertiser ? "Recent Campaigns" : "Recent Tasks"}
              </h2>
              <Link
                to={isAdvertiser ? "/campaigns" : "/tasks"}
                className="text-purple-400 hover:text-purple-300 flex items-center space-x-1"
              >
                <span>View all</span>
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-400">
                        {isAdvertiser 
                          ? `${task.applications} applications • Budget: ${task.budget}`
                          : `Deadline: ${task.deadline} • Payment: ${task.payment}`
                        }
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    <Eye className="h-5 w-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {isAdvertiser ? (
            <>
              <Link
                to="/tasks/create"
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-colors">
                    <Plus className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Create Task</h3>
                    <p className="text-gray-400 text-sm">Start a new advertising task</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/analytics"
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">View Analytics</h3>
                    <p className="text-gray-400 text-sm">Track campaign performance</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/wallet"
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Manage Wallet</h3>
                    <p className="text-gray-400 text-sm">Add funds and track spending</p>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/tasks"
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-colors">
                    <Eye className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Task Hall</h3>
                    <p className="text-gray-400 text-sm">Find new opportunities</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/youtube-connect"
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Youtube className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">YouTube Account</h3>
                    <p className="text-gray-400 text-sm">Connect your channel</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/earnings"
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">View Earnings</h3>
                    <p className="text-gray-400 text-sm">Track your income</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}