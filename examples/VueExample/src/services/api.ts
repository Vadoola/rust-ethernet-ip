import axios from 'axios'
import { backendConfig } from '../config/backend'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Start with proxy, will be updated if needed
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Initialize the API with the correct backend URL
let isInitialized = false;

const initializeApi = async () => {
  if (isInitialized) return;
  
  try {
    const backendUrl = await backendConfig.getBackendUrl();
    if (backendUrl && backendUrl !== '/api') {
      // Validate the URL before setting it
      try {
        new URL(backendUrl);
        // If we detected a valid direct backend URL, update the axios instance
        api.defaults.baseURL = backendUrl;
        console.log(`API configured to use backend at: ${backendUrl}`);
      } catch (urlError) {
        console.warn('Invalid backend URL detected, using proxy fallback:', urlError);
      }
    }
    isInitialized = true;
  } catch (error) {
    console.warn('Failed to detect backend, using proxy fallback:', error);
    isInitialized = true;
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ConnectionResponse extends ApiResponse {
  data?: {
    isConnected: boolean
    connectionString: string
    timestamp: string
  }
}

export interface TagValue {
  tagName: string
  value: any
  dataType: string
  timestamp: string
  quality: string
}

export interface TagOperation {
  tagName: string
  operation: 'read' | 'write'
  value?: any
  dataType?: string
}

export interface BatchOperation {
  operations: TagOperation[]
}

export interface BatchResult {
  tagName: string
  operation: 'read' | 'write'
  success: boolean
  value?: any
  error?: string
  executionTime: number
}

// API Service
export const apiService = {
  // Initialize the API service
  async initialize() {
    await initializeApi();
  },
  
  // Connection management
  async connect(connectionString: string): Promise<ConnectionResponse> {
    await this.initialize();
    try {
      const response = await api.post('/connect', { connectionString })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  },

  async disconnect(): Promise<ApiResponse> {
    await this.initialize();
    try {
      const response = await api.post('/disconnect')
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed'
      }
    }
  },

  async getConnectionStatus(): Promise<ConnectionResponse> {
    await this.initialize();
    try {
      const response = await api.get('/status')
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      }
    }
  },

  // Tag operations
  async readTag(tagName: string): Promise<ApiResponse<TagValue>> {
    try {
      const response = await api.get(`/tag/${encodeURIComponent(tagName)}`)
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tag read failed'
      }
    }
  },

  async writeTag(tagName: string, value: any, dataType?: string): Promise<ApiResponse> {
    try {
      const response = await api.post(`/tag/${encodeURIComponent(tagName)}`, {
        value,
        dataType
      })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tag write failed'
      }
    }
  },

  // Batch operations
  async executeBatch(operations: TagOperation[]): Promise<ApiResponse<BatchResult[]>> {
    try {
      const response = await api.post('/batch', { operations })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch operation failed'
      }
    }
  },

  // Tag discovery
  async discoverTags(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get('/tags')
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tag discovery failed'
      }
    }
  },

  async getTagInfo(tagName: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`/taginfo/${encodeURIComponent(tagName)}`)
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tag info retrieval failed'
      }
    }
  },

  // Performance testing
  async runBenchmark(operations: number = 100): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/benchmark', { operations })
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Benchmark failed'
      }
    }
  },

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }
}

export default apiService

// Re-export types for convenience
export type { 
  ApiResponse, 
  ConnectionResponse, 
  TagValue, 
  TagOperation, 
  BatchOperation, 
  BatchResult 
}
