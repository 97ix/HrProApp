import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { storage } from './storage';

let socket: any | null = null;

export const initSocket = async () => {
    const serverIp = await storage.getItem<string>('server_ip');
    if (!serverIp) return null;

    let url = serverIp.trim();
    if (!url.startsWith('http')) {
        url = `http://${url}`;
    }

    const isCloud = url.startsWith('https') || url.includes('onrender.com');
    if (!isCloud && !url.includes(':', 7)) {
        url = `${url}:6060`;
    }

    if (socket) {
        socket.disconnect();
    }

    socket = io(url, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('Connected to HR Pro Server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from HR Pro Server');
    });

    return socket;
};

export const getSocket = () => socket;
