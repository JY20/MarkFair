import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useUser } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StarknetProvider } from './providers/StarknetProvider';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { MyTasks } from './pages/tasks/MyTasks';
import { CreateTask } from './pages/tasks/CreateTask';
import { TaskHall } from './pages/tasks/TaskHall';
import { YouTubeConnect } from './pages/YouTubeConnect';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { SEO, pageSEO } from './components/SEO';
import { Settings } from './pages/Settings';

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();
  const { user, fetchUserProfile, isProfileLoaded, setUserRole } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    // Only check for role when user is signed in and auth is loaded
    if (isSignedIn && isLoaded && user) {
      // Check if user profile is loaded and if user has a role set
      if (isProfileLoaded) {
        if (!user.role) {
          // No role set, show modal
          setShowRoleModal(true);
        }
      }
    }
  }, [isSignedIn, isLoaded, user, isProfileLoaded]);

  if (!isLoaded || (isSignedIn && !isProfileLoaded)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              <SEO {...pageSEO.home} />
              <Home />
            </>
          } />
          
          {/* Protected Dashboard Routes */}
          {isSignedIn ? (
            <>
              <Route path="/dashboard" element={
                <>
                  <SEO {...pageSEO.dashboard} />
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </>
              } />
              <Route path="/tasks/my-tasks" element={
                <>
                  <SEO 
                    title="My Tasks - MarkFair"
                    description="View and manage your assigned marketing tasks. Track progress and submit completed work for payment."
                    keywords="my tasks, task management, KOL tasks, brand tasks, task tracking"
                  />
                  <DashboardLayout>
                    <MyTasks />
                  </DashboardLayout>
                </>
              } />
              <Route path="/tasks/create" element={
                <>
                  <SEO {...pageSEO.createTask} />
                  <DashboardLayout>
                    <CreateTask />
                  </DashboardLayout>
                </>
              } />
              <Route path="/tasks" element={
                <>
                  <SEO {...pageSEO.tasks} />
                  <DashboardLayout>
                    <TaskHall />
                  </DashboardLayout>
                </>
              } />
              <Route path="/youtube-connect" element={
                <>
                  <SEO {...pageSEO.youtubeConnect} />
                  <DashboardLayout>
                    <YouTubeConnect />
                  </DashboardLayout>
                </>
              } />
              <Route path="/analytics" element={
                <>
                  <SEO 
                    title="Analytics - MarkFair"
                    description="View detailed analytics and performance metrics for your marketing campaigns and KOL activities."
                    keywords="analytics, performance metrics, campaign analytics, marketing insights"
                  />
                  <DashboardLayout>
                    <div className="p-8">
                      <h1 className="text-3xl font-bold text-white">Analytics</h1>
                      <p className="text-gray-400 mt-2">Coming soon...</p>
                    </div>
                  </DashboardLayout>
                </>
              } />
              <Route path="/wallet" element={
                <>
                  <SEO 
                    title="Wallet - MarkFair"
                    description="Manage your crypto wallet, view balances, and track payment history on the MarkFair platform."
                    keywords="crypto wallet, blockchain wallet, payment history, wallet management"
                  />
                  <DashboardLayout>
                    <div className="p-8">
                      <h1 className="text-3xl font-bold text-white">Wallet</h1>
                      <p className="text-gray-400 mt-2">Coming soon...</p>
                    </div>
                  </DashboardLayout>
                </>
              } />
              <Route path="/settings" element={
                <>
                  <SEO 
                    title="Settings - MarkFair"
                    description="Configure your MarkFair account settings, preferences, and profile information."
                    keywords="account settings, user preferences, profile settings, account management"
                  />
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </>
              } />
            </>
          ) : (
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          )}
          
          {/* Redirect any unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelectRole={async (role) => {
          await setUserRole(role);
          setShowRoleModal(false);
        }}
      />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <StarknetProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </StarknetProvider>
    </HelmetProvider>
  );
}

export default App;