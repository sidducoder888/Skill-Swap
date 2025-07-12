import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user && token) {
      webSocketService.connect(token);

      const onConnect = () => {
        setIsConnected(true);
      };

      const onDisconnect = () => {
        setIsConnected(false);
      };

      const onSwapUpdate = (data: any) => {
        toast.success(data.message);
      };

      webSocketService.on('connect', onConnect);
      webSocketService.on('disconnect', onDisconnect);
      webSocketService.on('swap_update', onSwapUpdate);

      return () => {
        webSocketService.off('connect', onConnect);
        webSocketService.off('disconnect', onDisconnect);
        webSocketService.off('swap_update', onSwapUpdate);
        webSocketService.disconnect();
      };
    }
  }, [user, token]);

  const value = {
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
