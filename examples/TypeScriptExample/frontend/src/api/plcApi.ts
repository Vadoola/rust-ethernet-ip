import axios, { type AxiosResponse } from 'axios';

// Base URL for the ASP.NET Core API - try both HTTP and HTTPS
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api'  // Use HTTP on port 5000 where backend is actually running
  : 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for stability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Data type definitions
export type PlcDataType = 
  | 'BOOL' | 'SINT' | 'INT' | 'DINT' | 'LINT'
  | 'USINT' | 'UINT' | 'UDINT' | 'ULINT'
  | 'REAL' | 'LREAL' | 'STRING' | 'UDT';

export type PlcValue = string | number | boolean | Record<string, unknown> | null;

export interface PlcTag {
  name: string;
  type: PlcDataType;
  value: PlcValue;
  lastUpdated?: string;
  hasError?: boolean;
  errorMessage?: string;
}

export interface ConnectionRequest {
  address: string;
}

export interface WriteTagRequest {
  type: PlcDataType;
  value: PlcValue;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface TagReadResponse {
  success: boolean;
  value: PlcValue;
  type: PlcDataType;
  message?: string;
}

export interface BenchmarkResponse {
  success: boolean;
  readRate: number;
  writeRate: number;
  message: string;
  details?: {
    testTag: string;
    durationSeconds: number;
    readCount: number;
    writeCount: number;
    readErrors: number;
    writeErrors: number;
    tagExists: boolean;
    detectedType: string;
  };
}

export interface PlcStatus {
  isConnected: boolean;
  address: string;
  lastReadTimes: Record<string, string>;
}

export interface StatusResponse {
  success: boolean;
  status: PlcStatus;
}

// ================================================================================
// BATCH OPERATIONS - High Performance Multi-Tag Operations
// ================================================================================

export interface BatchReadRequest {
  tagNames: string[];
}

export interface BatchWriteRequest {
  tagValues: Record<string, PlcValue>;
}

export interface BatchOperation {
  isWrite: boolean;
  tagName: string;
  value?: PlcValue;
}

export interface BatchMixedRequest {
  operations: BatchOperation[];
}

export interface TagReadResult {
  success: boolean;
  value?: PlcValue;
  dataType?: PlcDataType;
  errorMessage?: string;
}

export interface TagWriteResult {
  success: boolean;
  errorMessage?: string;
}

export interface BatchReadResult {
  success: boolean;
  results?: Record<string, TagReadResult>;
  performance?: {
    totalTimeMs: number;
    successCount: number;
    errorCount: number;
    averageTimePerTagMs: number;
    tagsPerSecond: number;
  };
  errorMessage?: string;
}

export interface BatchWriteResult {
  success: boolean;
  results?: Record<string, TagWriteResult>;
  performance?: {
    totalTimeMs: number;
    successCount: number;
    errorCount: number;
    averageTimePerTagMs: number;
    tagsPerSecond: number;
  };
  errorMessage?: string;
}

export interface MixedOperationResult {
  tagName: string;
  isWrite: boolean;
  success: boolean;
  value?: PlcValue;
  executionTimeMs: number;
  errorCode: number;
  errorMessage?: string;
}

export interface BatchMixedResult {
  success: boolean;
  results?: MixedOperationResult[];
  performance?: {
    totalTimeMs: number;
    successCount: number;
    errorCount: number;
    averageTimePerOperationMs: number;
    operationsPerSecond: number;
  };
  errorMessage?: string;
}

export interface BatchConfig {
  maxOperationsPerPacket: number;
  maxPacketSize: number;
  packetTimeoutMs: number;
  continueOnError: boolean;
  optimizePacketPacking: boolean;
}

export interface BatchConfigResponse {
  success: boolean;
  config?: BatchConfig;
  presets?: {
    defaultConfig: BatchConfig;
    highPerformance: BatchConfig;
    conservative: BatchConfig;
  };
}

export interface BatchBenchmarkRequest {
  tagCount: number;
  testType: 'Read' | 'Write' | 'Mixed';
  compareWithIndividual: boolean;
}

export interface BatchBenchmarkResult {
  success: boolean;
  testType: string;
  tagCount: number;
  individualTotalTimeMs: number;
  individualSuccessCount: number;
  individualAverageTimeMs: number;
  batchTotalTimeMs: number;
  batchSuccessCount: number;
  batchAverageTimeMs: number;
  speedupFactor: number;
  timeSavedMs: number;
  timeSavedPercentage: number;
  networkEfficiencyFactor: number;
  errorMessage?: string;
}

export interface BatchBenchmarkResponse {
  success: boolean;
  benchmark?: BatchBenchmarkResult;
  message?: string;
}

export interface BatchPerformanceStats {
  operationType: string;
  totalOperations: number;
  totalTimeMs: number;
  successfulOperations: number;
  executionCount: number;
  lastExecuted: string;
  averageTimePerOperation: number;
  successRate: number;
  averageTimePerExecution: number;
}

export interface BatchStatsResponse {
  success: boolean;
  stats?: Record<string, BatchPerformanceStats>;
  summary?: {
    totalOperationTypes: number;
    totalOperations: number;
    totalTimeMs: number;
    overallSuccessRate: number;
  };
}

/**
 * PLC API Client - TypeScript interface to Rust EtherNet/IP library
 * Communicates with ASP.NET Core backend via REST API
 */
export class PlcApiClient {
  
  private async makeRequest<T>(method: 'get' | 'post' | 'delete', url: string, data?: any): Promise<T> {
    // Try the configured URL first
    try {
      const response = await apiClient.request<T>({
        method,
        url,
        data,
      });
      return response.data;
    } catch (error) {
      // If using HTTPS fails, try HTTP as fallback
      if (API_BASE_URL.includes('https://')) {
        try {
          const httpUrl = API_BASE_URL.replace('https://', 'http://'); // Keep same port since we're already on 5001
          const httpClient = axios.create({
            baseURL: httpUrl,
            timeout: 30000, // Increased to 30 seconds for stability
            headers: { 'Content-Type': 'application/json' },
          });
          
          const response = await httpClient.request<T>({
            method,
            url,
            data,
          });
          return response.data;
        } catch (httpError) {
          // If both fail, throw the original HTTPS error
          throw error;
        }
      }
      throw error;
    }
  }
  
  /**
   * Connect to a PLC
   */
  async connect(address: string): Promise<ApiResponse> {
    try {
      return await this.makeRequest<ApiResponse>('post', '/plc/connect', {
        address
      } as ConnectionRequest);
    } catch (error) {
      return this.handleError(error, 'Failed to connect to PLC');
    }
  }

  /**
   * Disconnect from PLC
   */
  async disconnect(): Promise<ApiResponse> {
    try {
      return await this.makeRequest<ApiResponse>('post', '/plc/disconnect');
    } catch (error) {
      return this.handleError(error, 'Failed to disconnect from PLC');
    }
  }

  // ================================================================================
  // BATCH OPERATIONS - High Performance Multi-Tag Operations
  // ================================================================================

  /**
   * Read multiple tags in a single optimized batch operation.
   * Provides 3-10x performance improvement over individual reads.
   */
  async batchReadTags(tagNames: string[]): Promise<BatchReadResult> {
    try {
      return await this.makeRequest<BatchReadResult>('post', '/plc/batch/read', {
        tagNames
      } as BatchReadRequest);
    } catch (error) {
      return this.handleError(error, 'Failed to perform batch read') as BatchReadResult;
    }
  }

  /**
   * Write multiple tags in a single optimized batch operation.
   * Provides 3-10x performance improvement over individual writes.
   */
  async batchWriteTags(tagValues: Record<string, PlcValue>): Promise<BatchWriteResult> {
    try {
      return await this.makeRequest<BatchWriteResult>('post', '/plc/batch/write', {
        tagValues
      } as BatchWriteRequest);
    } catch (error) {
      return this.handleError(error, 'Failed to perform batch write') as BatchWriteResult;
    }
  }

  /**
   * Execute a mixed batch of read and write operations in optimized packets.
   * Ideal for coordinated control operations and data collection.
   */
  async executeBatch(operations: BatchOperation[]): Promise<BatchMixedResult> {
    try {
      return await this.makeRequest<BatchMixedResult>('post', '/plc/batch/execute', {
        operations
      } as BatchMixedRequest);
    } catch (error) {
      return this.handleError(error, 'Failed to execute mixed batch') as BatchMixedResult;
    }
  }

  /**
   * Configure batch operation behavior for performance optimization.
   */
  async configureBatch(config: BatchConfig): Promise<BatchConfigResponse> {
    try {
      return await this.makeRequest<BatchConfigResponse>('post', '/plc/batch/config', config);
    } catch (error) {
      return this.handleError(error, 'Failed to configure batch operations') as BatchConfigResponse;
    }
  }

  /**
   * Get current batch operation configuration.
   */
  async getBatchConfig(): Promise<BatchConfigResponse> {
    try {
      return await this.makeRequest<BatchConfigResponse>('get', '/plc/batch/config');
    } catch (error) {
      return this.handleError(error, 'Failed to get batch configuration') as BatchConfigResponse;
    }
  }

  /**
   * Run performance benchmark comparing individual vs batch operations.
   */
  async runBatchBenchmark(request?: BatchBenchmarkRequest): Promise<BatchBenchmarkResponse> {
    try {
      return await this.makeRequest<BatchBenchmarkResponse>('post', '/plc/batch/benchmark', request);
    } catch (error) {
      return this.handleError(error, 'Failed to run batch benchmark') as BatchBenchmarkResponse;
    }
  }

  /**
   * Get batch operation performance statistics.
   */
  async getBatchStats(): Promise<BatchStatsResponse> {
    try {
      return await this.makeRequest<BatchStatsResponse>('get', '/plc/batch/stats');
    } catch (error) {
      return this.handleError(error, 'Failed to get batch statistics') as BatchStatsResponse;
    }
  }

  /**
   * Reset batch operation performance statistics.
   */
  async resetBatchStats(): Promise<ApiResponse> {
    try {
      return await this.makeRequest<ApiResponse>('delete', '/plc/batch/stats');
    } catch (error) {
      return this.handleError(error, 'Failed to reset batch statistics');
    }
  }

  // ================================================================================
  // INDIVIDUAL OPERATIONS (Existing)
  // ================================================================================

  /**
   * Read a tag from the PLC (auto-detects type)
   */
  async readTag(tagName: string): Promise<TagReadResponse> {
    try {
      const response: AxiosResponse<TagReadResponse> = await apiClient.get(`/plc/tag/${encodeURIComponent(tagName)}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, `Failed to read tag: ${tagName}`) as TagReadResponse;
    }
  }

  /**
   * Write a tag to the PLC
   */
  async writeTag(tagName: string, type: PlcDataType, value: PlcValue): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post(`/plc/tag/${encodeURIComponent(tagName)}`, {
        type,
        value
      } as WriteTagRequest);
      return response.data;
    } catch (error) {
      return this.handleError(error, `Failed to write tag: ${tagName}`);
    }
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(testTag?: string, testWrites: boolean = false, durationSeconds: number = 5): Promise<BenchmarkResponse> {
    try {
      const requestBody = testTag ? {
        testTag,
        testWrites,
        durationSeconds
      } : undefined;

      return await this.makeRequest<BenchmarkResponse>('post', '/plc/benchmark', requestBody);
    } catch (error) {
      return this.handleError(error, 'Failed to run benchmark') as BenchmarkResponse;
    }
  }

  /**
   * Get PLC connection status
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response: AxiosResponse<StatusResponse> = await apiClient.get('/plc/status');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to get PLC status') as StatusResponse;
    }
  }

  /**
   * Read multiple tags in parallel (legacy - use batchReadTags for better performance)
   */
  async readMultipleTags(tagNames: string[]): Promise<PlcTag[]> {
    try {
      const promises = tagNames.map(async (tagName) => {
        const result = await this.readTag(tagName);
        return {
          name: tagName,
          type: result.type || 'BOOL',
          value: result.value,
          lastUpdated: new Date().toISOString(),
          hasError: !result.success,
          errorMessage: result.message
        } as PlcTag;
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to read multiple tags:', error);
      return tagNames.map(name => ({
        name,
        type: 'BOOL' as PlcDataType,
        value: null,
        hasError: true,
        errorMessage: 'Failed to read tag'
      }));
    }
  }

  /**
   * Write multiple tags in parallel (legacy - use batchWriteTags for better performance)
   */
  async writeMultipleTags(tags: Array<{ name: string; type: PlcDataType; value: PlcValue }>): Promise<ApiResponse[]> {
    try {
      const promises = tags.map(tag => this.writeTag(tag.name, tag.type, tag.value));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to write multiple tags:', error);
      return tags.map(() => ({
        success: false,
        message: 'Failed to write tag'
      }));
    }
  }

  /**
   * Discover tag type by attempting to read it
   */
  async discoverTag(tagName: string): Promise<PlcTag | null> {
    try {
      const result = await this.readTag(tagName);
      if (result.success) {
        return {
          name: tagName,
          type: result.type,
          value: result.value,
          lastUpdated: new Date().toISOString(),
          hasError: false
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to discover tag ${tagName}:`, error);
      return null;
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: unknown, defaultMessage: string): ApiResponse {
    console.error(defaultMessage, error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message
        };
      }
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Cannot connect to PLC API server. Make sure the ASP.NET Core backend is running.'
        };
      }
      if (error.code === 'ETIMEDOUT') {
        return {
          success: false,
          message: 'Request timed out. Check PLC connection.'
        };
      }
    }

    return {
      success: false,
      message: defaultMessage
    };
  }
}

// Export singleton instance
export const plcApi = new PlcApiClient();

// Export batch configuration presets
export const BATCH_CONFIG_PRESETS = {
  default: {
    maxOperationsPerPacket: 20,
    maxPacketSize: 504,
    packetTimeoutMs: 3000,
    continueOnError: true,
    optimizePacketPacking: true
  } as BatchConfig,
  
  highPerformance: {
    maxOperationsPerPacket: 50,
    maxPacketSize: 4000,
    packetTimeoutMs: 1000,
    continueOnError: true,
    optimizePacketPacking: true
  } as BatchConfig,
  
  conservative: {
    maxOperationsPerPacket: 10,
    maxPacketSize: 504,
    packetTimeoutMs: 5000,
    continueOnError: false,
    optimizePacketPacking: false
  } as BatchConfig
};

// Export data type information
export const DATA_TYPE_INFO: Record<PlcDataType, { 
  description: string; 
  range?: string; 
  example: PlcValue;
  category: string;
}> = {
  BOOL: { 
    description: 'Boolean values', 
    range: 'true/false', 
    example: true,
    category: 'Boolean'
  },
  SINT: { 
    description: '8-bit signed integer', 
    range: '-128 to 127', 
    example: -100,
    category: 'Signed Integer'
  },
  INT: { 
    description: '16-bit signed integer', 
    range: '-32,768 to 32,767', 
    example: -1000,
    category: 'Signed Integer'
  },
  DINT: { 
    description: '32-bit signed integer', 
    range: '-2.1B to 2.1B', 
    example: -1000000,
    category: 'Signed Integer'
  },
  LINT: { 
    description: '64-bit signed integer', 
    range: 'Very large range', 
    example: -1000000000,
    category: 'Signed Integer'
  },
  USINT: { 
    description: '8-bit unsigned integer', 
    range: '0 to 255', 
    example: 200,
    category: 'Unsigned Integer'
  },
  UINT: { 
    description: '16-bit unsigned integer', 
    range: '0 to 65,535', 
    example: 50000,
    category: 'Unsigned Integer'
  },
  UDINT: { 
    description: '32-bit unsigned integer', 
    range: '0 to 4.3B', 
    example: 3000000,
    category: 'Unsigned Integer'
  },
  ULINT: { 
    description: '64-bit unsigned integer', 
    range: 'Very large range', 
    example: 5000000000,
    category: 'Unsigned Integer'
  },
  REAL: { 
    description: '32-bit IEEE 754 float', 
    range: '±3.4E±38', 
    example: 123.45,
    category: 'Floating Point'
  },
  LREAL: { 
    description: '64-bit IEEE 754 double', 
    range: '±1.7E±308', 
    example: 123.456789,
    category: 'Floating Point'
  },
  STRING: { 
    description: 'Variable-length strings', 
    range: 'Text data', 
    example: 'Hello PLC',
    category: 'Text'
  },
  UDT: { 
    description: 'User Defined Types', 
    range: 'Complex structures', 
    example: { motor: { speed: 1750 } },
    category: 'Complex'
  }
};

// Export advanced tag examples
export const ADVANCED_TAG_EXAMPLES = [
  'Program:MainProgram.Motor.Status',
  'DataArray[5]',
  'StatusWord.15',
  'MotorData.Speed',
  'ProductName.LEN',
  'Program:Production.Lines[2].Stations[5].Motor.Status.15',
  'Recipe.Step1.Temperature.Setpoint',
  'Program:Safety.EmergencyStop',
  'SensorReadings[10]',
  'Program:Vision.ImageData[10,20,3]'
];

// Export batch operation examples
export const BATCH_OPERATION_EXAMPLES = {
  dataAcquisition: [
    'ProductionCount',
    'Temperature_1',
    'Temperature_2', 
    'Pressure_1',
    'FlowRate',
    'QualityGrade'
  ],
  
  recipeManagement: {
    'Recipe_ID': 101,
    'Mix_Time': 45,
    'Temperature_SP': 180,
    'Pressure_SP': 25,
    'Speed_SP': 1200
  },
  
  statusMonitoring: [
    'Zone1_Temp',
    'Zone1_Humidity', 
    'Zone1_Alarm',
    'Zone2_Temp',
    'Zone2_Humidity',
    'Zone2_Alarm',
    'Zone3_Temp',
    'Zone3_Humidity',
    'Zone3_Alarm'
  ],
  
  mixedOperations: [
    { isWrite: false, tagName: 'CurrentTemp' },
    { isWrite: false, tagName: 'CurrentPressure' },
    { isWrite: true, tagName: 'TempSetpoint', value: 78.5 },
    { isWrite: true, tagName: 'PressureSetpoint', value: 15.2 },
    { isWrite: true, tagName: 'AutoModeEnabled', value: true }
  ] as BatchOperation[]
}; 