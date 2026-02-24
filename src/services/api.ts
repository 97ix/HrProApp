import axios from 'axios';
import { storage } from './storage';

const api = axios.create({
    timeout: 10000,
});

api.interceptors.request.use(async (config) => {
    const serverIp = await storage.getItem<string>('server_ip');
    if (serverIp) {
        // Ensure the IP has http:// and port if not present
        let baseUrl = serverIp.trim();
        if (!baseUrl.startsWith('http')) {
            baseUrl = `http://${baseUrl}`;
        }

        const isCloud = baseUrl.startsWith('https') || baseUrl.includes('onrender.com');
        if (!isCloud && !baseUrl.includes(':', 7)) {
            baseUrl = `${baseUrl}:6060`;
        }
        config.baseURL = baseUrl;
        console.log('API Request to:', config.baseURL + config.url);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
