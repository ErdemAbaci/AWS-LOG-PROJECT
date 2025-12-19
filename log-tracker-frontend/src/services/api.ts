import axios from 'axios';

// Vite proxy handles the base URL rewrite to localhost:3000
const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface LogParams {
    level?: string;
    ip?: string;
    search?: string;
}

export interface LocationData {
    country: string;
    region: string;
    city: string;
    timezone: string;
}

export interface LogData {
    id: string;
    message: string;
    level: string;
    ip: string;
    userAgent?: string;
    timestamp: string;
    location: LocationData;
    s3Url?: string | null;
}

export const getLogs = async (params: LogParams = {}): Promise<LogData[]> => {
    try {
        const response = await api.get<LogData[]>('/logs', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
    }
};

export const createLog = async (logData: Partial<LogData>): Promise<{ status: string; logId: string }> => {
    try {
        const response = await api.post('/log', logData);
        return response.data;
    } catch (error) {
        console.error("Error creating log:", error);
        throw error;
    }
};

export const getCloudWatchLogs = async (): Promise<any[]> => {
    try {
        const response = await api.get('/cloudwatch-logs');
        return response.data;
    } catch (error) {
        console.error("Error fetching CloudWatch logs:", error);
        throw error;
    }
};
