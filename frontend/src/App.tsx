import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();
  const { user } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    console.log('user', user);
    if (isSignedIn && isLoaded && user) {
      // Check if user has selected a role
      const savedRole = localStorage.getItem('userRole');
      if (!savedRole) {
        setShowRoleModal(true);
      }
    }
  }, [isSignedIn, isLoaded, user]);

  if (!isLoaded) {
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
          <Route path="/" element={<Home />} />
          
          {/* Protected Dashboard Routes */}
          {isSignedIn ? (
            <>
              <Route path="/dashboard" element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              } />
              <Route path="/tasks/my-tasks" element={
                <DashboardLayout>
                  <MyTasks />
                </DashboardLayout>
              } />
              <Route path="/tasks/create" element={
                <DashboardLayout>
                  <CreateTask />
                </DashboardLayout>
              } />
              <Route path="/tasks" element={
                <DashboardLayout>
                  <TaskHall />
                </DashboardLayout>
              } />
              <Route path="/youtube-connect" element={
                <DashboardLayout>
                  <YouTubeConnect />
                </DashboardLayout>
              } />
              <Route path="/analytics" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-3xl font-bold text-white">Analytics</h1>
                    <p className="text-gray-400 mt-2">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/wallet" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-3xl font-bold text-white">Wallet</h1>
                    <p className="text-gray-400 mt-2">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/settings" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 mt-2">Coming soon...</p>
                  </div>
                </DashboardLayout>
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
        onSelectRole={(role) => {
          // Role is already saved in the modal component
          setShowRoleModal(false);
        }}
      />
    </>
  );
}

function App() {
  return (
    <StarknetProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </StarknetProvider>
  );
}

export default App;