'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Socket.IO URL - defaults to API URL without /api/v1 path
const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // If API URL is set, derive Socket URL from it
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  return apiUrl.replace('/api/v1', '');
};

const SOCKET_URL = getSocketUrl();

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.tenantId) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Socket connected');
      }
      setConnected(true);
      
      // Join tenant room
      newSocket.emit('join-tenant', user.tenantId);
    });

    newSocket.on('disconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Socket disconnected');
      }
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Socket connection error:', error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.tenantId]);

  return { socket, connected };
}

