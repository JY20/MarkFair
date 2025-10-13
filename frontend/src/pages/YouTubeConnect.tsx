import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Youtube, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Eye, 
  Calendar,
  ExternalLink,
  Unlink,
  Wallet
} from 'lucide-react';
import { Api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface YouTubeChannel {
  id: string;
  name: string;
  subscribers: number;
  views: number;
  videos: number;
  joinDate: string;
  avatar: string;
  verified: boolean;
}

export function YouTubeConnect() {
  const { wallet } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    console.log(wallet)
    // 检查是否已绑定钱包
    if (!wallet) {
      setShowWalletModal(true);
    } else {
      setShowWalletModal(false);
    }
  }, [wallet]);

  useEffect(() => {
    Api.get('/api/health')
      .then((data) => {
        console.log('Health check response:', data);
      })
      .catch((error) => {
        console.error('Health check failed:', error);
      });
  }, []);

  // Mock YouTube channel data
  const mockChannel: YouTubeChannel = {
    id: 'UC123456789',
    name: 'Tech Reviews Pro',
    subscribers: 125000,
    views: 5200000,
    videos: 342,
    joinDate: '2020-03-15',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    verified: true
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Mock OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setChannel(mockChannel);
      setIsConnected(true);
      
      // In real implementation, this would:
      // 1. Redirect to YouTube OAuth
      // 2. Get authorization code
      // 3. Exchange for access token
      // 4. Fetch channel data
      // 5. Store connection in backend
      
    } catch (error) {
      console.error('Failed to connect YouTube:', error);
      alert('Failed to connect YouTube account. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setChannel(null);
    setIsConnected(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">YouTube Account</h1>
          <p className="text-gray-400">
            Connect your YouTube channel to verify your content creator status
          </p>
        </div>

        {showWalletModal ? (
          /* Wallet Connection Required Card */
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-8 w-8 text-yellow-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Wallet Connection Required
              </h2>
              
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                You need to connect your wallet before you can link your YouTube account.
                This is required to verify your identity and secure your content creator status.
              </p>

              <a 
                href="/dashboard" 
                className="px-8 py-4 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-all flex items-center space-x-3 mx-auto w-fit"
              >
                <Wallet className="h-5 w-5" />
                <span>Connect Wallet</span>
              </a>
            </div>
          </div>
        ) : !isConnected ? (
          /* Connection Card */
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Youtube className="h-8 w-8 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Connect Your YouTube Channel
              </h2>
              
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Link your YouTube account to verify your subscriber count, content niche, 
                and eligibility for advertising tasks.
              </p>

              <div className="bg-gray-700/30 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">What we'll access:</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Channel name and subscriber count</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Video statistics and performance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Content categories and topics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <span className="text-gray-300">We will NOT post or modify your content</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center space-x-3 mx-auto"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Youtube className="h-5 w-5" />
                    <span>Connect with YouTube</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Connected Channel Display */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Channel Overview */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Connected Channel</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <img
                  src={channel?.avatar}
                  alt={channel?.name}
                  className="w-20 h-20 rounded-full"
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">{channel?.name}</h3>
                    {channel?.verified && (
                      <CheckCircle className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  
                  <p className="text-gray-400 mb-4">Channel ID: {channel?.id}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                      <Users className="h-6 w-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {formatNumber(channel?.subscribers || 0)}
                      </div>
                      <div className="text-sm text-gray-400">Subscribers</div>
                    </div>
                    
                    <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                      <Eye className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {formatNumber(channel?.views || 0)}
                      </div>
                      <div className="text-sm text-gray-400">Total Views</div>
                    </div>
                    
                    <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                      <Youtube className="h-6 w-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {channel?.videos || 0}
                      </div>
                      <div className="text-sm text-gray-400">Videos</div>
                    </div>
                    
                    <div className="bg-gray-700/30 p-4 rounded-lg text-center">
                      <Calendar className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {new Date(channel?.joinDate || '').getFullYear()}
                      </div>
                      <div className="text-sm text-gray-400">Joined</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Verification Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Channel Connected</p>
                      <p className="text-sm text-gray-400">Your YouTube channel is successfully linked</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Subscriber Threshold Met</p>
                      <p className="text-sm text-gray-400">You have {formatNumber(channel?.subscribers || 0)} subscribers (minimum 1K required)</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Content Verified</p>
                      <p className="text-sm text-gray-400">Your content category has been identified as Tech Reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <a
                  href={`https://youtube.com/channel/${channel?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Channel</span>
                </a>
              </div>
              
              <button
                onClick={handleDisconnect}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                <Unlink className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}