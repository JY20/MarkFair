import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  Eye,
  Youtube,
  X,
} from 'lucide-react';
import { Api } from '../../api';
import { toast } from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  platform: 'youtube';
  budget: number;
  deadline_ts: number;
  refund_after_ts: number;
  advertiser: string;
  applicants: number;
  maxApplicants: number;
  status: 'open' | 'closed' | 'in_progress';
  tags: string[];
  minSubscribers?: number;
  minLikes?: number;
  applied?: boolean;
}

export function TaskHall() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [appliedTasks, setAppliedTasks] = useState<Set<string>>(new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Mock data for available tasks
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Tech Product Review Campaign',
      description: 'Looking for tech reviewers to showcase our new smartphone',
      platform: 'youtube',
      budget: 800,
      deadline_ts: Math.floor(Date.now() / 1000) + 86400 * 7,
      refund_after_ts: Math.floor(Date.now() / 1000) + 86400 * 14,
      advertiser: 'TechCorp Inc.',
      applicants: 12,
      maxApplicants: 20,
      status: 'open',
      tags: ['Tech', 'Review', 'Smartphone'],
      minSubscribers: 10000,
      minLikes: 500
    },
    {
      id: '2',
      title: 'Gaming Channel Sponsorship - New RPG Game',
      description: 'Sponsor gaming content creators for our new RPG game launch. Create gameplay videos and honest reviews.',
      platform: 'youtube',
      budget: 1200,
      deadline_ts: Math.floor(Date.now() / 1000) + 86400 * 10,
      refund_after_ts: Math.floor(Date.now() / 1000) + 86400 * 17,
      advertiser: 'GameStudio Pro',
      applicants: 8,
      maxApplicants: 15,
      status: 'open',
      tags: ['Gaming', 'RPG', 'Sponsorship'],
      minSubscribers: 25000,
      minLikes: 1000
    },
    {
      id: '3',
      title: 'Fitness App Promotion Campaign',
      description: 'Promote our fitness app to health-conscious audience. Show app features and workout routines.',
      platform: 'youtube',
      budget: 600,
      deadline_ts: Math.floor(Date.now() / 1000) + 86400 * 5,
      refund_after_ts: Math.floor(Date.now() / 1000) + 86400 * 12,
      advertiser: 'FitLife Apps',
      applicants: 15,
      maxApplicants: 25,
      status: 'open',
      tags: ['Fitness', 'Health', 'App'],
      minSubscribers: 5000,
      minLikes: 200
    },
    {
      id: '4',
      title: 'Cooking Tutorial - Kitchen Gadget Review',
      description: 'Create cooking tutorials using our new kitchen gadgets. Show practical usage and recipes.',
      platform: 'youtube',
      budget: 450,
      deadline_ts: Math.floor(Date.now() / 1000) - 86400,
      refund_after_ts: Math.floor(Date.now() / 1000) + 86400 * 6,
      advertiser: 'KitchenMaster',
      applicants: 20,
      maxApplicants: 20,
      status: 'closed',
      tags: ['Cooking', 'Kitchen', 'Tutorial'],
      minSubscribers: 8000,
      minLikes: 300
    }
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || task.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'closed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const handleApplyTask = (taskId: string) => {
    setCurrentTaskId(taskId);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!videoUrl.trim()) {
      toast.error('请输入YouTube视频地址');
      return;
    }

    setIsSubmitting(true);
    try {
      // await Api.post('/api/youtube/videos', { 
      //   video_url: videoUrl,
      //   task_id: currentTaskId 
      // });
      // toast.success('申请成功！');
      setAppliedTasks(prev => new Set([...prev, currentTaskId]));
      setShowApplyModal(false);
      setVideoUrl('');
      navigate('/tasks/my-tasks');
    } catch (error) {
      console.error('申请失败:', error);
      toast.error('申请失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold text-white mb-2">Task Hall</h1>
            <p className="text-gray-400">
              Discover and apply for advertising tasks that match your content
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white"
              >
                <option value="all">All Tasks</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      <span className="capitalize">{task.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">by {task.advertiser}</p>
                </div>
                <Youtube className="h-6 w-6 text-red-500" />
              </div>

              {/* <p className="text-gray-300 mb-4 text-sm leading-relaxed">{task.description}</p> */}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    ${task.budget}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    Deadline: {new Date(task.deadline_ts * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">
                    {task.applicants}/{task.maxApplicants} applied
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">
                    Refund: {new Date(task.refund_after_ts * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* YouTube Metrics */}
              {(task.minSubscribers || task.minLikes) && (
                <div className="bg-gray-700/30 p-3 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">YouTube Requirements:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {task.minSubscribers && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-400">Min {task.minSubscribers.toLocaleString()} subscribers</span>
                      </div>
                    )}
                    {task.minLikes && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400">Min {task.minLikes.toLocaleString()} likes/video</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>



              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  className="flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>{expandedTaskId === task.id ? 'Hide Details' : 'View Details'}</span>
                </button>
                {task.status === 'open' && (
                  appliedTasks.has(task.id) ? (
                    <button
                      disabled
                      className="flex-1 py-2 px-4 bg-green-600/20 text-green-400 rounded-lg border border-green-500/30 cursor-not-allowed"
                    >
                      Applied ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyTask(task.id)}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all"
                    >
                      Apply Now
                    </button>
                  )
                )}
              </div>
              
              {/* Expanded Details */}
              {expandedTaskId === task.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-gray-700"
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Detailed Description</h4>
                      <p className="text-gray-400 text-sm">{task.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-1">Advertiser</h4>
                        <p className="text-gray-400 text-sm">{task.advertiser}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-1">Platform</h4>
                        <p className="text-gray-400 text-sm capitalize">{task.platform}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-1">Deadline</h4>
                        <p className="text-gray-400 text-sm">{new Date(task.deadline_ts * 1000).toLocaleDateString()} ({new Date(task.deadline_ts * 1000).toLocaleTimeString()})</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-1">Refund After</h4>
                        <p className="text-gray-400 text-sm">{new Date(task.refund_after_ts * 1000).toLocaleDateString()} ({new Date(task.refund_after_ts * 1000).toLocaleTimeString()})</p>
                      </div>
                    </div>
                    
                    {task.minSubscribers || task.minLikes ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-1">Requirements</h4>
                        <ul className="list-disc list-inside text-gray-400 text-sm">
                          {task.minSubscribers && (
                            <li>Minimum {task.minSubscribers.toLocaleString()} subscribers</li>
                          )}
                          {task.minLikes && (
                            <li>Minimum {task.minLikes.toLocaleString()} likes per video</li>
                          )}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks found matching your criteria.</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          </div>
        )}
        
        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Apply for Task</h3>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  YouTube Video URL
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Please provide a link to your YouTube video that best represents your content for this task.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}