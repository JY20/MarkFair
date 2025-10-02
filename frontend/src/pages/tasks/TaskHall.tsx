import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  DollarSign, 
  Users, 
  CheckCircle,
  Youtube,
  Filter,
  Search,
  Calendar,
  Target
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  platform: 'youtube';
  budget: number;
  deadline: string;
  requirements: string[];
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [appliedTasks, setAppliedTasks] = useState<Set<string>>(new Set());

  // Mock data for available tasks
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Tech Product Review - Latest Smartphone',
      description: 'Looking for tech reviewers to create an in-depth review video of our latest smartphone. Must include unboxing, features overview, and honest opinion.',
      platform: 'youtube',
      budget: 800,
      deadline: '2024-02-15',
      requirements: ['Tech niche', 'English content', 'Previous phone reviews'],
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
      deadline: '2024-02-20',
      requirements: ['Gaming content', 'RPG experience', 'Active community'],
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
      deadline: '2024-02-10',
      requirements: ['Fitness niche', 'Regular uploads', 'Health content'],
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
      deadline: '2024-01-30',
      requirements: ['Cooking content', 'Recipe videos', 'Kitchen reviews'],
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
    // Mock application logic
    setAppliedTasks(prev => new Set([...prev, taskId]));
    alert(`Successfully applied to task! The advertiser will review your application.`);
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

              <p className="text-gray-300 mb-4 text-sm leading-relaxed">{task.description}</p>

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
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">
                    {task.applicants}/{task.maxApplicants} applied
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">
                    {task.requirements.length} requirements
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

              {/* Requirements */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Requirements:</h4>
                <div className="space-y-1">
                  {task.requirements.slice(0, 3).map((req, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-gray-400">{req}</span>
                    </div>
                  ))}
                  {task.requirements.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{task.requirements.length - 3} more requirements
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
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
      </motion.div>
    </div>
  );
}