import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  Users, 
  CheckCircle,
  AlertCircle,
  Pause,
  Wallet,
  Youtube,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStarknet } from '../../hooks/useStarknet';

interface Task {
  id: string;
  title: string;
  description: string;
  platform: 'youtube';
  budget: number;
  applications?: number;
  kolParticipants?: number; // Number of KOL participants
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'applied' | 'in_progress' | 'pending_payment';
  createdAt: string;
  deadline: string;
  requirements: string[];
  advertiser?: string;
  progress?: number;
  canClaim?: boolean;
}

export function MyTasks() {
  const { user } = useAuth();
  const { isConnected, connectWallet } = useStarknet();
  const isAdvertiser = user?.role === 'advertiser';
  const [claimingTask, setClaimingTask] = useState<string | null>(null);

  // Mock data - different for advertisers vs KOLs
  const [tasks] = useState<Task[]>(
    isAdvertiser ? [
      {
        id: '1',
        title: 'Tech Product Review Campaign',
        description: 'Looking for tech reviewers to showcase our new smartphone',
        platform: 'youtube',
        budget: 2400,
        applications: 23,
        kolParticipants: 5,
        status: 'active',
        createdAt: '2024-01-10',
        deadline: '2024-02-10',
        requirements: ['10K+ subscribers', 'Tech niche', 'English content'],
        progress: 60
      },
      {
        id: '2',
        title: 'Gaming Channel Sponsorship',
        description: 'Sponsor gaming content creators for our new game launch',
        platform: 'youtube',
        budget: 5600,
        applications: 45,
        kolParticipants: 8,
        status: 'completed',
        createdAt: '2024-01-05',
        deadline: '2024-01-25',
        requirements: ['Gaming content', '50K+ subscribers', 'Active community'],
        progress: 100
      },
      {
        id: '3',
        title: 'Fitness App Promotion',
        description: 'Promote our fitness app to health-conscious audience',
        platform: 'youtube',
        budget: 1800,
        applications: 12,
        kolParticipants: 0,
        status: 'draft',
        createdAt: '2024-01-12',
        deadline: '2024-02-15',
        requirements: ['Fitness niche', '5K+ subscribers', 'Regular uploads'],
        progress: 0
      }
    ] : [
      {
        id: '1',
        title: 'Tech Product Review Campaign',
        description: 'Create an in-depth review video of the latest smartphone',
        platform: 'youtube',
        budget: 800,
        status: 'completed',
        createdAt: '2024-01-10',
        deadline: '2024-01-25',
        requirements: ['10K+ subscribers', 'Tech niche', 'English content'],
        advertiser: 'TechCorp Inc.',
        progress: 100,
        canClaim: true
      },
      {
        id: '2',
        title: 'Gaming Channel Sponsorship',
        description: 'Create gameplay videos for new RPG game',
        platform: 'youtube',
        budget: 1200,
        status: 'in_progress',
        createdAt: '2024-01-15',
        deadline: '2024-02-15',
        requirements: ['Gaming content', '25K+ subscribers', 'RPG experience'],
        advertiser: 'GameStudio Pro',
        progress: 75
      },
      {
        id: '3',
        title: 'Fitness App Promotion',
        description: 'Show app features and workout routines',
        platform: 'youtube',
        budget: 600,
        status: 'applied',
        createdAt: '2024-01-18',
        deadline: '2024-02-20',
        requirements: ['Fitness niche', '5K+ subscribers', 'Health content'],
        advertiser: 'FitLife Apps',
        progress: 0
      },
      {
        id: '4',
        title: 'Cooking Tutorial Campaign',
        description: 'Create cooking tutorials using kitchen gadgets',
        platform: 'youtube',
        budget: 450,
        status: 'pending_payment',
        createdAt: '2024-01-08',
        deadline: '2024-01-30',
        requirements: ['Cooking content', '8K+ subscribers', 'Recipe videos'],
        advertiser: 'KitchenMaster',
        progress: 100,
        canClaim: true
      }
    ]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'completed':
      case 'pending_payment':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'applied':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'draft':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'paused':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'completed':
      case 'pending_payment':
        return <CheckCircle className="h-4 w-4" />;
      case 'applied':
        return <Eye className="h-4 w-4" />;
      case 'draft':
        return <Edit className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleClaimPayment = async (taskId: string, amount: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first to claim payment');
      try {
        await connectWallet();
      } catch (error) {
        return;
      }
    }

    setClaimingTask(taskId);
    
    try {
      // Mock wallet transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully claimed $${amount} for task completion!`);
      
      // Update task status (in real app, this would come from backend)
      // For demo purposes, we'll just show success
    } catch (error) {
      console.error('Failed to claim payment:', error);
      alert('Failed to claim payment. Please try again.');
    } finally {
      setClaimingTask(null);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isAdvertiser ? 'My Published Tasks' : 'My Tasks'}
            </h1>
            <p className="text-gray-400">
              {isAdvertiser 
                ? 'Manage and track your advertising campaigns'
                : 'Track your task applications and earnings'
              }
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tasks</p>
                <p className="text-2xl font-bold text-white">{tasks.length}</p>
              </div>
              <div className="p-3 bg-primary-500/20 rounded-lg">
                <Eye className="h-6 w-6 text-primary-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {isAdvertiser ? 'Active Tasks' : 'In Progress'}
                </p>
                <p className="text-2xl font-bold text-white">
                  {isAdvertiser 
                    ? tasks.filter(t => t.status === 'active').length
                    : tasks.filter(t => t.status === 'in_progress').length
                  }
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {isAdvertiser ? 'Total Budget' : 'Total Earned'}
                </p>
                <p className="text-2xl font-bold text-white">
                  ${tasks.reduce((sum, task) => sum + task.budget, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {isAdvertiser ? 'KOL Participants' : 'Completed'}
                </p>
                <p className="text-2xl font-bold text-white">
                  {isAdvertiser 
                    ? tasks.reduce((sum, task) => sum + (task.kolParticipants || 0), 0)
                    : tasks.filter(t => t.status === 'completed' || t.status === 'pending_payment').length
                  }
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Users className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Tasks Overview</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gray-700/30 p-6 rounded-lg hover:bg-gray-700/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="capitalize">{task.status.replace('_', ' ')}</span>
                        </div>
                        <Youtube className="h-5 w-5 text-red-500" />
                      </div>
                      
                      <p className="text-gray-400 mb-4">{task.description}</p>
                      
                      {!isAdvertiser && task.advertiser && (
                        <p className="text-sm text-gray-500 mb-3">by {task.advertiser}</p>
                      )}

                      {/* Progress bar for both advertisers and KOLs */}
                      {typeof task.progress === 'number' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>{isAdvertiser ? 'Campaign Progress' : 'Task Progress'}</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${getProgressColor(task.progress)}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">
                            {isAdvertiser ? 'Budget' : 'Payment'}: ${task.budget.toLocaleString()}
                          </span>
                        </div>
                        {isAdvertiser && task.kolParticipants !== undefined && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-gray-300">
                              {task.kolParticipants} KOL participants
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">
                            Deadline: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {task.requirements.map((req, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {isAdvertiser && (
                        <>
                          <button className="p-2 text-gray-400 hover:text-yellow-400 transition-colors">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {/* Claim Payment Button for KOLs */}
                      {!isAdvertiser && task.canClaim && (
                        <button
                          onClick={() => handleClaimPayment(task.id, task.budget)}
                          disabled={claimingTask === task.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
                        >
                          {claimingTask === task.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="h-4 w-4" />
                              <span>Claim ${task.budget}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Wallet Connection Reminder for KOLs */}
        {!isAdvertiser && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-yellow-400 font-medium">Wallet Not Connected</p>
                <p className="text-yellow-300/80 text-sm">
                  Connect your Starknet wallet to claim payments for completed tasks
                </p>
              </div>
              <button
                onClick={() => {
                  // This will be handled by the wallet connector modal
                  alert('Please use the wallet connection button in the header');
                }}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}