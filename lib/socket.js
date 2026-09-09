import { io } from 'socket.io-client';
import { BASE_URL, tokenStorage } from './api';
import { useAlertStore } from '../store/alertStore';

let socket = null;

export const connectSocket = async (hospitalId) => {
  const token = await tokenStorage.getAccess();

  socket = io(BASE_URL.replace('/api', ''), {
    auth: { token },
    query: { hospitalId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to hospital room:', hospitalId);
    socket.emit('join:hospital', hospitalId);
  });

  socket.on('alert:new', (alert) => {
    useAlertStore.getState().addAlert(alert);
  });

  socket.on('alert:acknowledge', (id) => {
    useAlertStore.getState().acknowledge(id);
  });

  socket.on('disconnect', () => console.log('[Socket] Disconnected'));

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
