import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Browse } from './pages/Browse';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { Skills } from './pages/Skills';
import { Swaps } from './pages/Swaps';
import { Admin } from './pages/Admin';
import { NotFound } from './pages/NotFound';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Box sx={{ 
              minHeight: '100vh', 
              backgroundColor: 'background.default',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="browse" element={<Browse />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="user/:id" element={<UserProfile />} />
                  <Route path="skills" element={<Skills />} />
                  <Route path="swaps" element={<Swaps />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
            
            {/* Global toast notifications */}
            <Toaster 
              position="top-right"
              gutter={8}
              containerStyle={{
                zIndex: 9999,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '8px',
                  background: '#363636',
                  color: '#fff',
                  fontSize: '14px',
                  maxWidth: '500px',
                },
                success: {
                  iconTheme: {
                    primary: '#4caf50',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f44336',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App; 