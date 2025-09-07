// API service for PLC Monitor Dashboard

import axios from 'axios';
import {
  PLCConnection,
  TagValue,
  TagReadRequest,
  TagWriteRequest,
  TagSubscriptionRequest,
  PLCStatus,
  SubscriptionsResponse,
  ApiResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// PLC Connection API
export const plcApi = {
  // Connect to PLC
  connect: async (connection: PLCConnection): Promise<ApiResponse> => {
    const response = await api.post('/connect', connection);
    return response.data;
  },

  // Disconnect from PLC
  disconnect: async (): Promise<ApiResponse> => {
    const response = await api.post('/disconnect');
    return response.data;
  },

  // Get PLC status
  getStatus: async (): Promise<PLCStatus> => {
    const response = await api.get('/status');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<ApiResponse> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Tag Operations API
export const tagApi = {
  // Read a single tag
  readTag: async (request: TagReadRequest): Promise<TagValue> => {
    const response = await api.post('/tags/read', request);
    return response.data;
  },

  // Write to a tag
  writeTag: async (request: TagWriteRequest): Promise<ApiResponse> => {
    const response = await api.post('/tags/write', request);
    return response.data;
  },

  // Subscribe to a tag
  subscribeToTag: async (request: TagSubscriptionRequest): Promise<ApiResponse> => {
    const response = await api.post('/tags/subscribe', request);
    return response.data;
  },

  // Unsubscribe from a tag
  unsubscribeFromTag: async (tagName: string): Promise<ApiResponse> => {
    const response = await api.delete(`/tags/subscribe/${tagName}`);
    return response.data;
  },

  // Get all subscriptions
  getSubscriptions: async (): Promise<SubscriptionsResponse> => {
    const response = await api.get('/tags/subscriptions');
    return response.data;
  },
};

// WebSocket service for real-time updates
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.url.replace('http', 'ws');
        this.ws = new WebSocket(`${wsUrl}/ws`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.notifyListeners('message', data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('error', { message: 'Connection lost' });
    }
  }

  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create WebSocket service instance
export const wsService = new WebSocketService(API_BASE_URL);

export default api;
