import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AdminAuthProvider } from './contexts/AdminAuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/AdminProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import AccountSettingsPage from './pages/AccountSettingsPage.jsx';
import StoriesPage from './pages/StoriesPage.jsx';
import StoryCreatorPage from './pages/StoryCreatorPage.jsx';
import StoryDetailPage from './pages/StoryDetailPage.jsx';
import BenefitsPage from './pages/BenefitsPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminMusicPage from './pages/AdminMusicPage.jsx';

function App() {
  useEffect(() => {
    console.log('App initialized with providers');
  }, []);

  return (
    <LanguageProvider>
      <Router>
        <AuthProvider>
          <AdminAuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/benefits" element={<BenefitsPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route 
                path="/admin" 
                element={<Navigate to="/admin/dashboard" replace />} 
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/music"
                element={
                  <AdminProtectedRoute>
                    <AdminMusicPage />
                  </AdminProtectedRoute>
                }
              />

              {/* Protected User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-story"
                element={
                  <ProtectedRoute>
                    <StoryCreatorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-story/:id"
                element={
                  <ProtectedRoute>
                    <StoryCreatorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscribe"
                element={
                  <ProtectedRoute>
                    <SubscriptionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AccountSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stories"
                element={
                  <ProtectedRoute>
                    <StoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stories/:id"
                element={
                  <ProtectedRoute>
                    <StoryDetailPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-center" />
          </AdminAuthProvider>
        </AuthProvider>
      </Router>
    </LanguageProvider>
  );
}

export default App;