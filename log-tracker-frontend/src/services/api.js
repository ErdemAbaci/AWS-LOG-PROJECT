import axios from 'axios';

// Vite proxy handles the base URL rewrite to localhost:3000
const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getLogs = async (params = {}) => {
    try {
        const response = await api.get('/logs', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
    }
};

export const createLog = async (logData) => {
    try {
        const response = await api.post('/log', logData);
        return response.data;
    } catch (error) {
        console.error("Error creating log:", error);
        throw error;
    }
};

export const getCloudWatchLogs = async () => {
    try {
        const response = await api.get('/cloudwatch-logs');
        return response.data;
    } catch (error) {
        console.error("Error fetching CloudWatch logs:", error);
        throw error;
    }
};
