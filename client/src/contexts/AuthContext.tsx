import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';

// Types
interface User {
  id: number;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  bio?: string;
  location?: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  averageRating: number;
  completedSwaps: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  isOnline: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  location?: string;
  bio?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const isAuthenticated = !!user && !!token;

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (isAuthenticated && token) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, token]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
      if (isAuthenticated && token) {
        connectWebSocket();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost');
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, token]);

  const initializeAuth = async () => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Verify token is still valid
        try {
          const response = await apiService.getProfile();
          if (response.success) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          // Token is invalid, clear auth state
          clearAuthState();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!token) return;

    setConnectionStatus('connecting');
    webSocketService.connect(token);

    // Set up WebSocket event listeners
    webSocketService.on('connection:established', () => {
      setConnectionStatus('connected');
    });

    webSocketService.on('connection:lost', () => {
      setConnectionStatus('disconnected');
    });

    webSocketService.on('user:updated', (data: any) => {
      if (data.userId === user?.id) {
        setUser(prev => prev ? { ...prev, ...data.updates } : null);
      }
    });

    webSocketService.on('user:online', (data: any) => {
      if (data.userId === user?.id) {
        setUser(prev => prev ? { ...prev, isOnline: true } : null);
      }
    });

    webSocketService.on('user:offline', (data: any) => {
      if (data.userId === user?.id) {
        setUser(prev => prev ? { ...prev, isOnline: false } : null);
      }
    });

    // Update user status to online
    webSocketService.updateUserStatus('online');
  };

  const disconnectWebSocket = () => {
    webSocketService.disconnect();
    setConnectionStatus('disconnected');
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ email, password });
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set token in API service
        apiService.setAuthToken(newToken);
        
        toast.success(`Welcome back, ${userData.firstName}!`);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success) {
        const { token: newToken, user: newUser } = response.data;
        
        setToken(newToken);
        setUser(newUser);
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Set token in API service
        apiService.setAuthToken(newToken);
        
        toast.success(`Welcome to Skill Swap, ${newUser.firstName}!`);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Update user status to offline
      if (connectionStatus === 'connected') {
        webSocketService.updateUserStatus('offline');
      }
      
      // Call logout endpoint
      await apiService.logout();
      
      // Clear auth state
      clearAuthState();
      
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails, clear local state
      clearAuthState();
      toast.error('Logout failed, but you have been logged out locally');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.updateProfile(userData);
      
      if (response.success) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await apiService.refreshToken();
      
      if (response.success) {
        const { token: newToken } = response.data;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        apiService.setAuthToken(newToken);
        
        // Reconnect WebSocket with new token
        if (isAuthenticated) {
          connectWebSocket();
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      // If token refresh fails, logout user
      clearAuthState();
      toast.error('Session expired. Please login again.');
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.removeAuthToken();
    disconnectWebSocket();
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    isOnline,
    connectionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 