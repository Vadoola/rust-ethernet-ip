import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  plcApi, 
  type PlcTag, 
  type PlcDataType, 
  type PlcStatus,
  type BatchOperation,
  type BatchConfig,
  type BatchReadResult,
  type BatchWriteResult,
  type BatchMixedResult,
  type BatchBenchmarkResult,
  type BatchPerformanceStats,
  DATA_TYPE_INFO,
  BATCH_CONFIG_PRESETS
} from './api/plcApi';
import { 
  Activity, 
  Cpu, 
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Settings,
  Play,
  RotateCcw
} from 'lucide-react';
import './App.css';

// Tab type definition
type TabType = 'individual' | 'batch' | 'performance' | 'config';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

function App() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [plcAddress, setPlcAddress] = useState('192.168.0.1:44818');
  const [connectionStatus, setConnectionStatus] = useState<PlcStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionIssues, setConnectionIssues] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('individual');

  // Add debug logging for connection state changes
  useEffect(() => {
    console.log('Connection state changed:', { isConnected, isConnecting });
  }, [isConnected, isConnecting]);

  // Add debug logging for PLC address changes
  useEffect(() => {
    console.log('PLC address changed:', plcAddress);
  }, [plcAddress]);

  // Initialize app state on startup
  useEffect(() => {
    // Ensure we start in a clean disconnected state
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus(null);
    console.log('🚀 Application initialized - Ready to connect');
  }, []);

  // Individual tag operations
  const [tagToDiscover, setTagToDiscover] = useState('');
  const [selectedTag, setSelectedTag] = useState<PlcTag | null>(null);
  const [tagValue, setTagValue] = useState('');
  const [selectedDataType, setSelectedDataType] = useState<PlcDataType>('BOOL');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // ================================================================================
  // BATCH OPERATIONS STATE
  // ================================================================================

  // Batch Read
  const [batchReadTags, setBatchReadTags] = useState<string>('TestTag\nTestBool\nTestInt\nTestReal');
  const [batchReadResult, setBatchReadResult] = useState<BatchReadResult | null>(null);
  const [isBatchReading, setIsBatchReading] = useState(false);

  // Batch Write
  const [batchWriteData, setBatchWriteData] = useState<string>('TestTag=true\nTestBool=false\nTestInt=999\nTestReal=88.8');
  const [batchWriteResult, setBatchWriteResult] = useState<BatchWriteResult | null>(null);
  const [isBatchWriting, setIsBatchWriting] = useState(false);

  // Mixed Operations
  const [mixedOperations, setMixedOperations] = useState<string>('read:TestTag\nread:TestBool\nwrite:TestInt=777\nwrite:TestReal=99.9');
  const [mixedResult, setMixedResult] = useState<BatchMixedResult | null>(null);
  const [isMixedExecuting, setIsMixedExecuting] = useState(false);

  // Batch Configuration
  const [batchConfig, setBatchConfig] = useState<BatchConfig>(BATCH_CONFIG_PRESETS.default);
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Batch Performance
  const [batchBenchmarkResult, setBatchBenchmarkResult] = useState<BatchBenchmarkResult | null>(null);
  const [isBatchBenchmarking, setIsBatchBenchmarking] = useState(false);
  const [batchStats, setBatchStats] = useState<Record<string, BatchPerformanceStats> | null>(null);

  // Performance monitoring
  const [benchmarkResults, setBenchmarkResults] = useState<{ readRate: number; writeRate: number } | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkTestTag, setBenchmarkTestTag] = useState('');
  const [benchmarkTestWrites, setBenchmarkTestWrites] = useState(false);

  // Tag monitoring
  const [monitoredTags, setMonitoredTags] = useState<PlcTag[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Test tag creation
  const [isCreatingTags, setIsCreatingTags] = useState(false);

  // Logging
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Counter for unique log IDs - use useRef to avoid stale closure issues
  const logCounterRef = useRef(0);

  // Add log entry
  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${logCounterRef.current}`, // Use timestamp + counter for guaranteed uniqueness
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 logs
    logCounterRef.current += 1; // Increment counter for next log
  }, []); // Empty dependency array since we're using ref

  // ================================================================================
  // BATCH OPERATIONS HANDLERS
  // ================================================================================

  const handleBatchRead = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    const tagNames = batchReadTags.split('\n').map(t => t.trim()).filter(t => t);
    if (tagNames.length === 0) {
      addLog('error', 'No tags specified for batch read');
      return;
    }

    setIsBatchReading(true);
    addLog('info', `🚀 Starting batch read for ${tagNames.length} tags...`);

    try {
      const result = await plcApi.batchReadTags(tagNames);
      setBatchReadResult(result);

      if (result.success && result.performance) {
        addLog('success', `✅ Batch read completed: ${result.performance.successCount}/${tagNames.length} successful in ${result.performance.totalTimeMs}ms`);
        addLog('info', `📊 Performance: ${result.performance.tagsPerSecond.toFixed(1)} tags/sec, ${result.performance.averageTimePerTagMs.toFixed(2)}ms per tag`);
      } else {
        addLog('error', `❌ Batch read failed: ${result.errorMessage}`);
      }
    } catch (error) {
      addLog('error', `❌ Batch read error: ${error}`);
    } finally {
      setIsBatchReading(false);
    }
  };

  const handleBatchWrite = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    // Parse tag=value pairs
    const tagValues: Record<string, any> = {};
    const lines = batchWriteData.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
      const [tag, value] = line.split('=').map(s => s.trim());
      if (!tag || value === undefined) {
        addLog('error', `Invalid format in line: ${line}. Use format: TagName=Value`);
        return;
      }
      
      // Auto-detect value type
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        tagValues[tag] = value.toLowerCase() === 'true';
      } else if (!isNaN(Number(value))) {
        tagValues[tag] = Number(value);
      } else {
        tagValues[tag] = value;
      }
    }

    if (Object.keys(tagValues).length === 0) {
      addLog('error', 'No valid tag=value pairs specified');
      return;
    }

    setIsBatchWriting(true);
    addLog('info', `✏️ Starting batch write for ${Object.keys(tagValues).length} tags...`);

    try {
      const result = await plcApi.batchWriteTags(tagValues);
      setBatchWriteResult(result);

      if (result.success && result.performance) {
        addLog('success', `✅ Batch write completed: ${result.performance.successCount}/${Object.keys(tagValues).length} successful in ${result.performance.totalTimeMs}ms`);
        addLog('info', `📊 Performance: ${result.performance.tagsPerSecond.toFixed(1)} tags/sec, ${result.performance.averageTimePerTagMs.toFixed(2)}ms per tag`);
      } else {
        addLog('error', `❌ Batch write failed: ${result.errorMessage}`);
      }
    } catch (error) {
      addLog('error', `❌ Batch write error: ${error}`);
    } finally {
      setIsBatchWriting(false);
    }
  };

  const handleMixedOperations = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    // Parse mixed operations
    const operations: BatchOperation[] = [];
    const lines = mixedOperations.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
      if (line.toLowerCase().startsWith('read:')) {
        const tagName = line.substring(5).trim();
        operations.push({ isWrite: false, tagName });
      } else if (line.toLowerCase().startsWith('write:')) {
        const writeData = line.substring(6).trim();
        const [tag, value] = writeData.split('=').map(s => s.trim());
        if (!tag || value === undefined) {
          addLog('error', `Invalid write format: ${line}. Use format: write:TagName=Value`);
          return;
        }
        
        // Auto-detect value type
        let parsedValue: any = value;
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
          parsedValue = value.toLowerCase() === 'true';
        } else if (!isNaN(Number(value))) {
          parsedValue = Number(value);
        }
        
        operations.push({ isWrite: true, tagName: tag, value: parsedValue });
      } else {
        addLog('error', `Invalid operation format: ${line}. Use 'read:TagName' or 'write:TagName=Value'`);
        return;
      }
    }

    if (operations.length === 0) {
      addLog('error', 'No valid operations specified');
      return;
    }

    setIsMixedExecuting(true);
    addLog('info', `🔄 Starting mixed batch with ${operations.length} operations...`);

    try {
      const result = await plcApi.executeBatch(operations);
      setMixedResult(result);

      if (result.success && result.performance) {
        addLog('success', `✅ Mixed batch completed: ${result.performance.successCount}/${operations.length} successful in ${result.performance.totalTimeMs}ms`);
        addLog('info', `📊 Performance: ${result.performance.operationsPerSecond.toFixed(1)} ops/sec, ${result.performance.averageTimePerOperationMs.toFixed(2)}ms per operation`);
      } else {
        addLog('error', `❌ Mixed batch failed: ${result.errorMessage}`);
      }
    } catch (error) {
      addLog('error', `❌ Mixed batch error: ${error}`);
    } finally {
      setIsMixedExecuting(false);
    }
  };

  const handleBatchBenchmark = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    setIsBatchBenchmarking(true);
    addLog('info', '📊 Starting batch performance benchmark...');

    try {
      const result = await plcApi.runBatchBenchmark({
        tagCount: 10,
        testType: 'Mixed',
        compareWithIndividual: true
      });

      if (result.success && result.benchmark) {
        setBatchBenchmarkResult(result.benchmark);
        addLog('success', `✅ Benchmark completed: ${result.benchmark.speedupFactor.toFixed(1)}x speedup with batch operations`);
        addLog('info', `📈 Individual: ${result.benchmark.individualTotalTimeMs}ms, Batch: ${result.benchmark.batchTotalTimeMs}ms`);
        addLog('info', `💾 Network efficiency: ${result.benchmark.networkEfficiencyFactor}x fewer packets`);
      } else {
        addLog('error', `❌ Benchmark failed: ${result.message}`);
      }
    } catch (error) {
      addLog('error', `❌ Benchmark error: ${error}`);
    } finally {
      setIsBatchBenchmarking(false);
    }
  };

  const handleConfigureBatch = async (preset: 'default' | 'highPerformance' | 'conservative') => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    setIsConfiguring(true);
    const config = BATCH_CONFIG_PRESETS[preset];
    addLog('info', `⚙️ Applying ${preset} batch configuration...`);

    try {
      const result = await plcApi.configureBatch(config);
      if (result.success) {
        setBatchConfig(config);
        addLog('success', `✅ Batch configuration updated: ${config.maxOperationsPerPacket} ops/packet, ${config.maxPacketSize} bytes`);
      } else {
        addLog('error', `❌ Configuration failed`);
      }
    } catch (error) {
      addLog('error', `❌ Configuration error: ${error}`);
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleGetBatchStats = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    try {
      const result = await plcApi.getBatchStats();
      if (result.success && result.stats) {
        setBatchStats(result.stats);
        addLog('success', `📊 Retrieved batch statistics: ${Object.keys(result.stats).length} operation types`);
        if (result.summary) {
          addLog('info', `📈 Total operations: ${result.summary.totalOperations}, Success rate: ${result.summary.overallSuccessRate.toFixed(1)}%`);
        }
      } else {
        addLog('error', `❌ Failed to get statistics`);
      }
    } catch (error) {
      addLog('error', `❌ Statistics error: ${error}`);
    }
  };

  const handleResetBatchStats = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    try {
      const result = await plcApi.resetBatchStats();
      if (result.success) {
        setBatchStats(null);
        addLog('success', '🔄 Batch statistics reset successfully');
      } else {
        addLog('error', `❌ Failed to reset statistics: ${result.message}`);
      }
    } catch (error) {
      addLog('error', `❌ Reset error: ${error}`);
    }
  };

  // ================================================================================
  // EXISTING HANDLERS (Individual Operations)
  // ================================================================================

  // Connect to PLC
  const handleConnect = async () => {
    const trimmedAddress = plcAddress.trim();
    if (!trimmedAddress) {
      addLog('error', 'Please enter a PLC address');
      return;
    }

    // Validate address format
    if (!trimmedAddress.includes(':')) {
      addLog('error', 'Address should include port (e.g., 192.168.1.100:44818)');
      return;
    }

    // Check for obviously corrupted addresses
    if (trimmedAddress.length > 50) {
      addLog('error', 'Address appears corrupted. Please clear and re-enter.');
      setPlcAddress('192.168.0.1:44818'); // Reset to default
      return;
    }

    // Extra validation for corruption patterns
    if (trimmedAddress.includes('44818') && trimmedAddress.length > 20) {
      addLog('error', 'Address appears corrupted - contains repeated digits. Clearing...');
      setPlcAddress('192.168.0.1:44818'); // Reset to default
      return;
    }

    setIsConnecting(true);
    addLog('info', `🔌 Connecting to PLC at ${trimmedAddress}...`);
    addLog('info', `📡 Backend API: http://localhost:5000/api`);
    addLog('info', `📤 Sending request: {"address": "${trimmedAddress}"}`);

    try {
      // Test backend connectivity first
      addLog('info', '🔍 Testing backend connectivity...');
      
      const result = await plcApi.connect(trimmedAddress);
      console.log('Connect result:', result);
      
      if (result.success) {
        setIsConnected(true);
        addLog('success', `✅ Connected successfully! ${result.message || ''}`);
        await updateStatus();
        
        // Load initial batch configuration
        try {
          const configResult = await plcApi.getBatchConfig();
          if (configResult.success && configResult.config) {
            setBatchConfig(configResult.config);
          }
        } catch (error) {
          console.log('Could not load batch config:', error);
        }
      } else {
        addLog('error', `❌ Connection failed: ${result.message}`);
        if (result.message?.includes('Failed to connect to PLC')) {
          addLog('info', '💡 This usually means the PLC at the specified address is not reachable');
          addLog('info', '🔧 Check if:');
          addLog('info', '   • PLC is powered on and connected to network');
          addLog('info', '   • IP address and port are correct');
          addLog('info', '   • Network firewall allows connection');
          addLog('info', '   • PLC EtherNet/IP service is enabled');
        }
      }
    } catch (error) {
      console.error('Connect error:', error);
      addLog('error', `❌ Connection error: ${error}`);
      addLog('error', '🔧 Make sure the ASP.NET Core backend is running on http://localhost:5000');
      addLog('info', '💡 Try running: cd examples/AspNetExample && dotnet run');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from PLC
  const handleDisconnect = async () => {
    try {
      await plcApi.disconnect();
      setIsConnected(false);
      setConnectionStatus(null);
      setMonitoredTags([]);
      setIsMonitoring(false);
      setIsConnecting(false); // Ensure connecting state is reset
      
      // Clear batch operation results
      setBatchReadResult(null);
      setBatchWriteResult(null);
      setMixedResult(null);
      setBatchBenchmarkResult(null);
      setBatchStats(null);
      
      addLog('info', '📤 Disconnected from PLC');
    } catch (error) {
      addLog('error', `⚠️ Disconnect error: ${error}`);
      // Even if disconnect fails, reset the UI state
      setIsConnected(false);
      setConnectionStatus(null);
      setIsConnecting(false);
    }
  };

  // Update connection status
  const updateStatus = async () => {
    try {
      const result = await plcApi.getStatus();
      if (result.success && result.status) {
        const wasConnected = isConnected;
        const nowConnected = result.status.isConnected;
        
        setConnectionStatus(result.status);
        setIsConnected(nowConnected);
        setConnectionIssues(false); // Clear connection issues when successful
        
        // Detect disconnection
        if (wasConnected && !nowConnected) {
          addLog('warning', '⚠️ Connection lost! PLC session has expired or disconnected.');
          addLog('info', '💡 The backend or PLC connection has timed out. You may need to reconnect.');
          setMonitoredTags([]);
          setIsMonitoring(false);
          setConnectionIssues(true);
        }
        
        // Detect reconnection
        if (!wasConnected && nowConnected) {
          addLog('success', '✅ Connection restored!');
          setConnectionIssues(false);
        }
      } else {
        // Status check failed - might indicate backend/session issues
        if (isConnected) {
          addLog('warning', '⚠️ Status check failed - connection may be unstable');
          addLog('info', 'Checking if backend is still running...');
          setConnectionIssues(true);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      
      // Network error - backend might be down
      if (isConnected) {
        addLog('error', '❌ Lost connection to backend API');
        addLog('info', '🔧 The ASP.NET Core backend may have stopped or is unreachable');
        addLog('info', '💡 Try restarting the backend: cd examples/AspNetExample && dotnet run');
        
        // Mark as disconnected
        setIsConnected(false);
        setConnectionStatus(null);
        setMonitoredTags([]);
        setIsMonitoring(false);
        setConnectionIssues(true);
      }
    }
  };

  // Discover tag type
  const handleDiscoverTag = async () => {
    if (!tagToDiscover.trim()) {
      addLog('error', 'Please enter a tag name to discover');
      return;
    }

    setIsDiscovering(true);
    addLog('info', `🔍 Discovering tag: ${tagToDiscover}`);
    addLog('info', `📡 Trying to determine data type for "${tagToDiscover}"`);

    try {
      const tag = await plcApi.discoverTag(tagToDiscover);
      console.log('🔍 Discovery result:', tag);
      
      if (tag) {
        setSelectedTag(tag);
        setTagValue(String(tag.value));
        setSelectedDataType(tag.type);
        
        // Auto-populate benchmark test tag if not already set
        if (!benchmarkTestTag.trim()) {
          setBenchmarkTestTag(tag.name);
          addLog('info', `🎯 Set "${tag.name}" as benchmark test tag`);
        }
        
        addLog('success', `✅ Discovered ${tag.type} tag: ${tag.name} = ${tag.value}`);
        addLog('info', `🎯 Data type: ${tag.type}, Value: ${tag.value}`);
      } else {
        addLog('error', `❌ Could not determine type for tag: ${tagToDiscover}`);
        addLog('info', '💡 Possible reasons:');
        addLog('info', '   • Tag does not exist in PLC');
        addLog('info', '   • Tag name is incorrect (check spelling/case)');
        addLog('info', '   • Tag is an unsupported complex type');
        addLog('info', '   • Insufficient permissions to read tag');
        addLog('info', '📝 Common tag examples: Motor.Speed, Program:Main.Status, Tag1');
      }
    } catch (error) {
      console.error('🔍 Discovery error:', error);
      addLog('error', `❌ Discovery error: ${error}`);
      addLog('info', '🔧 Check browser console for detailed error information');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Read tag value
  const handleReadTag = async () => {
    if (!selectedTag) {
      addLog('warning', 'No tag selected');
      return;
    }

    setIsReading(true);
    addLog('info', `📖 Reading tag '${selectedTag.name}' as ${selectedDataType}...`);

    try {
      const response = await plcApi.readTag(selectedTag.name);
      if (response.success && response.value !== undefined) {
        setTagValue(String(response.value));
        addLog('success', `✅ Read ${response.type} tag '${selectedTag.name}' = ${response.value}`);
        
        // Update the tag in monitoring list
        const updatedTag: PlcTag = {
          ...selectedTag,
          value: response.value,
          type: response.type || selectedDataType,
          lastUpdated: new Date().toLocaleTimeString(),
          hasError: false,
          errorMessage: ''
        };
        
        // Add to monitoring if not already there
        setMonitoredTags(prev => {
          const existingIndex = prev.findIndex(tag => tag.name === selectedTag.name);
          if (existingIndex >= 0) {
            // Update existing tag
            const newTags = [...prev];
            newTags[existingIndex] = updatedTag;
            return newTags;
          } else {
            // Add new tag
            return [...prev, updatedTag];
          }
        });
      } else {
        const errorMsg = response.message || 'Failed to read tag';
        addLog('error', `❌ ${errorMsg}`);
        setTagValue('');
        
        // Check if this might be a session timeout
        if (errorMsg.includes('timeout') || errorMsg.includes('connection') || errorMsg.includes('session')) {
          addLog('info', '🔄 This might be a session timeout. Checking connection status...');
          updateStatus(); // Force status check
        }
        
        // Add error to monitoring
        const errorTag: PlcTag = {
          ...selectedTag,
          value: null,
          type: selectedDataType,
          lastUpdated: new Date().toLocaleTimeString(),
          hasError: true,
          errorMessage: errorMsg
        };
        
        setMonitoredTags(prev => {
          const existingIndex = prev.findIndex(tag => tag.name === selectedTag.name);
          if (existingIndex >= 0) {
            const newTags = [...prev];
            newTags[existingIndex] = errorTag;
            return newTags;
          } else {
            return [...prev, errorTag];
          }
        });
      }
    } catch (error) {
      const errorMsg = `Network error: ${error}`;
      addLog('error', `❌ ${errorMsg}`);
      
      // Network errors might indicate backend disconnection
      if (errorMsg.includes('Network Error') || errorMsg.includes('timeout')) {
        addLog('info', '🔍 Network error detected. Checking backend connectivity...');
        updateStatus(); // Force status check
      }
      
      setTagValue('');
    } finally {
      setIsReading(false);
    }
  };

  // Write tag
  const handleWriteTag = async () => {
    if (!selectedTag?.name) {
      addLog('error', 'Please select a tag to write');
      return;
    }

    setIsWriting(true);
    addLog('info', `✏️ Writing tag: ${selectedTag.name}`);

    try {
      // Convert value based on data type
      let convertedValue: string | number | boolean = tagValue;
      
      switch (selectedDataType) {
        case 'BOOL':
          convertedValue = tagValue.toLowerCase() === 'true';
          break;
        case 'SINT':
        case 'INT':
        case 'DINT':
        case 'LINT':
        case 'USINT':
        case 'UINT':
        case 'UDINT':
        case 'ULINT':
          convertedValue = parseInt(tagValue);
          if (isNaN(convertedValue)) {
            throw new Error('Invalid integer value');
          }
          break;
        case 'REAL':
        case 'LREAL':
          convertedValue = parseFloat(tagValue);
          if (isNaN(convertedValue)) {
            throw new Error('Invalid float value');
          }
          break;
        case 'STRING':
          convertedValue = tagValue;
          break;
        default:
          throw new Error(`Unsupported data type: ${selectedDataType}`);
      }

      const result = await plcApi.writeTag(selectedTag.name, selectedDataType, convertedValue);
      if (result.success) {
        addLog('success', `✅ Wrote ${selectedDataType}: ${convertedValue} to ${selectedTag.name}`);
      } else {
        addLog('error', `❌ Write error: ${result.message}`);
      }
    } catch (error) {
      addLog('error', `❌ Write error: ${error}`);
    } finally {
      setIsWriting(false);
    }
  };

  // Run benchmark
  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true);
    
    // Use selected tag if available, otherwise ask user to specify
    const testTag = benchmarkTestTag.trim() || selectedTag?.name || '';
    
    if (!testTag) {
      addLog('warning', '⚠️ No test tag specified. Please discover a tag first or enter a tag name.');
      addLog('info', '💡 Tip: First discover a tag, then run benchmark for better results');
      setIsRunningBenchmark(false);
      return;
    }

    addLog('info', `📊 Running benchmark with tag: "${testTag}"`);
    addLog('info', `🔧 Test writes: ${benchmarkTestWrites ? 'enabled' : 'disabled'}`);
    addLog('info', `⏱️ Duration: 5 seconds`);
    addLog('info', `🔍 Auto-detecting data type for optimal performance...`);

    try {
      const result = await plcApi.runBenchmark(testTag, benchmarkTestWrites, 5);
      console.log('📊 Benchmark result:', result);
      
      if (result.success) {
        setBenchmarkResults({
          readRate: result.readRate,
          writeRate: result.writeRate
        });
        addLog('success', `✅ ${result.message}`);
        
        // Log additional details if available
        if (result.details) {
          addLog('info', `📈 Performance: ${result.details.readCount} reads, ${result.details.writeCount} writes in ${result.details.durationSeconds.toFixed(1)}s`);
          addLog('info', `🎯 Data type detected: ${result.details.detectedType}`);
          
          if (result.details.readErrors > 0 || result.details.writeErrors > 0) {
            addLog('warning', `⚠️ Errors: ${result.details.readErrors} read errors, ${result.details.writeErrors} write errors`);
          }
          
          if (result.details.tagExists) {
            addLog('success', `✅ Tag "${result.details.testTag}" exists and is accessible as ${result.details.detectedType}`);
          }
          
          // Specific guidance for 0 ops/sec scenarios
          if (result.readRate === 0) {
            addLog('warning', '⚠️ 0 reads/sec indicates a problem:');
            addLog('info', '   • Tag may not exist in PLC');
            addLog('info', '   • Network/connection issues');
            addLog('info', '   • Tag access permissions problem');
            addLog('info', '💡 Try manually reading this tag first to verify it works');
          }
          
          if (benchmarkTestWrites && result.writeRate === 0 && result.readRate > 0) {
            addLog('warning', '⚠️ 0 writes/sec but reads work - possible causes:');
            addLog('info', '   • Tag is read-only');
            addLog('info', '   • Insufficient write permissions');
            addLog('info', '   • PLC program logic preventing writes');
            addLog('info', '💡 Try manually writing to this tag to test writability');
          }
        }
      } else {
        addLog('error', `❌ Benchmark error: ${result.message}`);
        if (result.details && !result.details.tagExists) {
          addLog('info', `🔍 Tag "${testTag}" was not found in any supported data type`);
          addLog('info', '💡 Common tag names: Motor.Speed, Program:Main.Status, MyTag');
          addLog('info', '🔧 Check PLC program for exact tag names and spellings');
        }
      }
    } catch (error) {
      console.error('📊 Benchmark error:', error);
      addLog('error', `❌ Benchmark error: ${error}`);
      addLog('info', '🔧 This usually indicates a backend communication problem');
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // Monitor tags (periodic refresh)
  useEffect(() => {
    if (!isConnected || !isMonitoring || monitoredTags.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const tagNames = monitoredTags.map(tag => tag.name);
        const updatedTags = await plcApi.readMultipleTags(tagNames);
        
        // Check if all tags are failing - might indicate session timeout
        const failedTags = updatedTags.filter(tag => tag.hasError);
        if (failedTags.length === updatedTags.length && updatedTags.length > 0) {
          addLog('warning', '⚠️ All tag reads failing - session may have timed out');
          addLog('info', '🔄 Checking connection status...');
          updateStatus(); // Force status check
        } else {
          setMonitoredTags(updatedTags);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
        addLog('error', `❌ Tag monitoring error: ${error}`);
        addLog('info', '🔍 Checking if connection is still active...');
        updateStatus(); // Force status check on error
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isConnected, isMonitoring, monitoredTags]);

  // Status update interval
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(updateStatus, 2000); // Update every 2 seconds for better responsiveness
    return () => clearInterval(interval);
  }, [isConnected]);

  // Connection health monitoring - separate from status updates
  useEffect(() => {
    if (!isConnected) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        // Try a simple status check to see if backend is responsive
        await plcApi.getStatus();
      } catch (error) {
        // If status check fails repeatedly, suggest reconnection
        addLog('warning', '⚠️ Backend connectivity issues detected');
        addLog('info', '💡 If problems persist, try disconnecting and reconnecting');
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isConnected]);

  // Handle PLC address change with explicit logging
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    console.log('🎯 Address input event:', { 
      current: plcAddress, 
      new: newAddress, 
      isConnected, 
      isConnecting,
      inputDisabled: isConnected || isConnecting 
    });
    
    // Prevent corruption by validating the input and debouncing
    if (newAddress.length <= 100) { // Reasonable length limit
      // Clear any special characters that might cause issues
      const cleanAddress = newAddress.replace(/[^\w\d\.\:\-]/g, '');
      console.log('Cleaned address:', cleanAddress);
      setPlcAddress(cleanAddress);
    } else {
      console.warn('Address input too long, ignoring');
      // Reset to a clean default if input becomes corrupted
      setPlcAddress('192.168.0.1:44818');
    }
  };

  // Add a new handler for creating test tags
  const handleCreateTestTags = async () => {
    if (!isConnected) {
      addLog('error', 'Not connected to PLC');
      return;
    }

    setIsCreatingTags(true);
    addLog('info', '📋 Creating test tags in PLC...');

    const testTags = [
      { name: 'TestTag', type: 'BOOL' as PlcDataType, value: true },
      { name: 'TestBool', type: 'BOOL' as PlcDataType, value: true },
      { name: 'TestInt', type: 'DINT' as PlcDataType, value: 42 },
      { name: 'TestReal', type: 'REAL' as PlcDataType, value: 123.45 }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const tag of testTags) {
      try {
        const result = await plcApi.writeTag(tag.name, tag.type, tag.value);
        if (result.success) {
          addLog('success', `✅ Created ${tag.name} (${tag.type}) = ${tag.value}`);
          successCount++;
        } else {
          addLog('error', `❌ Failed to create ${tag.name}: ${result.message}`);
          errorCount++;
        }
      } catch (error) {
        addLog('error', `❌ Error creating ${tag.name}: ${error}`);
        errorCount++;
      }
    }

    setIsCreatingTags(false);
    
    if (successCount > 0) {
      addLog('success', `✅ Created ${successCount}/${testTags.length} test tags successfully`);
      addLog('info', '🚀 Test tags are ready for batch operations!');
    } else {
      addLog('error', `❌ Failed to create any test tags (${errorCount} errors)`);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <Cpu className="header-icon" />
            <h1>🦀 Rust EtherNet/IP Driver - React Demo</h1>
          </div>
          <div className="header-status">
            {isConnected ? (
              <div className="status-connected">
                <CheckCircle size={20} />
                <span>Connected</span>
                <span className="session-info">Session: {connectionStatus?.address || 'undefined'}</span>
                {connectionIssues && (
                  <span className="connection-warning">⚠️ Issues detected</span>
                )}
              </div>
            ) : (
              <div className="status-disconnected">
                <AlertCircle size={20} />
                <span>Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Connection Section */}
        <section className="connection-section">
          <div className="connection-controls">
            <div className="address-input">
              <input
                type="text"
                value={plcAddress}
                onChange={handleAddressChange}
                placeholder="192.168.0.1:44818"
                disabled={isConnected || isConnecting}
                className={`plc-address-input ${isConnected || isConnecting ? 'input-disabled' : ''}`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="connection-buttons">
              <button
                onClick={handleConnect}
                disabled={isConnected || isConnecting}
                className="btn btn-connect"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="btn btn-disconnect"
              >
                Disconnect
              </button>
            </div>
          </div>
        </section>

        {/* Performance Metrics Section */}
        <section className="performance-section">
          <div className="performance-metrics">
            <div className="metric">
              <span className="metric-icon">📊</span>
              <span className="metric-label">Read Rate:</span>
              <span className="metric-value">{benchmarkResults?.readRate || 0} ops/sec</span>
            </div>
            <div className="metric">
              <span className="metric-icon">📝</span>
              <span className="metric-label">Write Rate:</span>
              <span className="metric-value">{benchmarkResults?.writeRate || 0} ops/sec</span>
            </div>
          </div>
          
          {/* Benchmark Configuration */}
          <div className="benchmark-config">
            <div className="benchmark-settings">
              <input
                type="text"
                value={benchmarkTestTag}
                onChange={(e) => setBenchmarkTestTag(e.target.value)}
                placeholder={selectedTag?.name || "Enter test tag name"}
                disabled={!isConnected || isRunningBenchmark}
                className="benchmark-tag-input"
              />
              <label className={`benchmark-checkbox ${benchmarkTestWrites ? 'checkbox-enabled' : 'checkbox-disabled'}`}>
                <input
                  type="checkbox"
                  checked={benchmarkTestWrites}
                  onChange={(e) => setBenchmarkTestWrites(e.target.checked)}
                  disabled={!isConnected || isRunningBenchmark}
                />
                <span className="checkbox-text">
                  <strong>Include writes</strong> 
                  <small>{benchmarkTestWrites ? ' (enabled)' : ' (disabled)'}</small>
                </span>
              </label>
            </div>
            <button
              onClick={handleRunBenchmark}
              disabled={!isConnected || isRunningBenchmark}
              className="btn btn-benchmark"
            >
              {isRunningBenchmark ? <Activity className="spinning" size={16} /> : '⚡'}
              {isRunningBenchmark ? 'Running...' : `Run Benchmark ${benchmarkTestWrites ? '(R+W)' : '(R)'}`}
            </button>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="main-content-area">
          {/* Tab Navigation */}
          <section className="tab-navigation">
            <div className="tab-buttons">
              <button
                onClick={() => setActiveTab('individual')}
                className={`tab-button ${activeTab === 'individual' ? 'tab-active' : ''}`}
              >
                📊 Individual Operations
              </button>
              <button
                onClick={() => setActiveTab('batch')}
                className={`tab-button ${activeTab === 'batch' ? 'tab-active' : ''}`}
              >
                <Zap size={16} />
                🚀 Batch Operations
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`tab-button ${activeTab === 'performance' ? 'tab-active' : ''}`}
              >
                <BarChart3 size={16} />
                📈 Performance
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`tab-button ${activeTab === 'config' ? 'tab-active' : ''}`}
              >
                <Settings size={16} />
                ⚙️ Configuration
              </button>
            </div>
          </section>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Individual Operations Tab */}
            {activeTab === 'individual' && (
              <div className="content-grid">
                <section className="panel tag-monitoring-panel">
                  <h2>📊 Individual Tag Operations</h2>
                  
                  {/* Tag Discovery */}
                  <div className="tag-discovery-section">
                    <div className="discovery-controls">
                      <input
                        type="text"
                        value={tagToDiscover}
                        onChange={(e) => setTagToDiscover(e.target.value)}
                        placeholder="Enter tag name"
                        disabled={!isConnected}
                        className="tag-input"
                      />
                      <button
                        onClick={handleDiscoverTag}
                        disabled={!isConnected || isDiscovering}
                        className="btn btn-discover"
                      >
                        {isDiscovering ? <Activity className="spinning" size={16} /> : 'Discover Tag'}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Monitoring Toggle */}
                  {monitoredTags.length > 0 && (
                    <div className="monitoring-controls-section">
                      <button
                        onClick={() => {
                          setIsMonitoring(!isMonitoring);
                          addLog('info', `🔄 Real-time monitoring ${!isMonitoring ? 'enabled' : 'disabled'}`);
                        }}
                        disabled={!isConnected}
                        className={`btn ${isMonitoring ? 'btn-monitoring-active' : 'btn-monitoring-inactive'}`}
                      >
                        {isMonitoring ? (
                          <>
                            <Activity className="spinning" size={16} />
                            Real-time Monitoring (ON)
                          </>
                        ) : (
                          <>
                            📊 Start Real-time Monitoring
                          </>
                        )}
                      </button>
                      {isMonitoring && (
                        <span className="monitoring-status">
                          ⚡ Updating every second...
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tag Operations */}
                  {selectedTag && (
                    <div className="tag-operations-section">
                      <div className="tag-controls">
                        <div className="tag-input-row">
                          <input
                            type="text"
                            value={selectedTag.name}
                            disabled
                            className="tag-name-input"
                          />
                          <select
                            value={selectedDataType}
                            onChange={(e) => setSelectedDataType(e.target.value as PlcDataType)}
                            disabled={!isConnected}
                            className="data-type-select"
                          >
                            {Object.entries(DATA_TYPE_INFO).map(([type]) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={tagValue}
                            onChange={(e) => setTagValue(e.target.value)}
                            placeholder="Value"
                            disabled={!isConnected}
                            className="tag-value-input"
                          />
                        </div>
                        <div className="tag-action-buttons">
                          <button
                            onClick={handleReadTag}
                            disabled={!isConnected || isReading}
                            className="btn btn-read"
                          >
                            {isReading ? <Activity className="spinning" size={16} /> : 'Read'}
                          </button>
                          <button
                            onClick={handleWriteTag}
                            disabled={!isConnected || isWriting}
                            className="btn btn-write"
                          >
                            {isWriting ? <Activity className="spinning" size={16} /> : 'Write'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tag Table */}
                  <div className="tag-table-section">
                    <table className="tag-table">
                      <thead>
                        <tr>
                          <th>Tag Name</th>
                          <th>Value</th>
                          <th>Type</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitoredTags.map((tag) => (
                          <tr key={tag.name} className={`${tag.hasError ? 'error-row' : ''} ${isMonitoring ? 'monitoring-active' : ''}`}>
                            <td>
                              {tag.name}
                              {isMonitoring && (
                                <span className="monitoring-indicator">🔄</span>
                              )}
                            </td>
                            <td>
                              {tag.hasError ? (
                                <span className="error-text">{tag.errorMessage}</span>
                              ) : (
                                <span className="value-text">{String(tag.value)}</span>
                              )}
                            </td>
                            <td>{tag.type}</td>
                            <td className="timestamp">{tag.lastUpdated}</td>
                          </tr>
                        ))}
                        {monitoredTags.length === 0 && (
                          <tr>
                            <td colSpan={4} className="no-tags">
                              No tags being monitored. Discover and read tags to populate this table.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Activity Log Panel */}
                <section className="panel activity-log-panel">
                  <h2>📋 Activity Log</h2>
                  <div className="log-container">
                    {logs.map((log) => (
                      <div key={log.id} className={`log-entry log-${log.level}`}>
                        <span className="log-timestamp">[{log.timestamp}]</span>
                        <span className="log-level-icon">
                          {log.level === 'success' && '✅'}
                          {log.level === 'info' && '📘'}
                          {log.level === 'warning' && '⚠️'}
                          {log.level === 'error' && '❌'}
                        </span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="no-logs">
                        Activity will be logged here when you interact with the PLC.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Batch Operations Tab */}
            {activeTab === 'batch' && (
              <section className="panel batch-operations-panel">
                <h2>🚀 Batch Operations - High Performance Multi-Tag Operations</h2>
                <p className="batch-description">
                  Batch operations provide <strong>3-10x performance improvement</strong> over individual operations 
                  by combining multiple reads/writes into optimized network packets.
                </p>

                {/* Setup Instructions */}
                <div className="batch-setup-info">
                  <h4>📋 Setup Instructions for Testing</h4>
                  <div className="setup-instructions">
                    <div className="instruction-step">
                      <strong>Step 1:</strong> Create test tags in your PLC program:
                      <ul>
                        <li><code>TestTag</code> (BOOL) - A boolean value for testing</li>
                        <li><code>TestBool</code> (BOOL) - Another boolean value</li>
                        <li><code>TestInt</code> (DINT) - A 32-bit integer</li>
                        <li><code>TestReal</code> (REAL) - A floating point number</li>
                      </ul>
                      <div className="string-limitation-note">
                        <strong>⚠️ Note:</strong> STRING tag support is not yet implemented in the underlying Rust library.
                        Only BOOL, DINT, INT, REAL, and numeric types are currently supported.
                      </div>
                    </div>
                    <div className="instruction-step">
                      <strong>Step 2:</strong> Or click the button below to create test tags automatically:
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          onClick={handleCreateTestTags}
                          disabled={!isConnected || isCreatingTags}
                          className="btn btn-create-tags"
                        >
                          {isCreatingTags ? <Activity className="spinning" size={16} /> : <Settings size={16} />}
                          {isCreatingTags ? 'Creating Tags...' : 'Create Test Tags'}
                        </button>
                      </div>
                    </div>
                    <div className="instruction-step">
                      <strong>Step 3:</strong> Or modify the tag names below to match existing tags in your PLC program.
                    </div>
                    <div className="instruction-step">
                      <strong>Note:</strong> If you see "1/5 successful" results, it likely means most tags don't exist in your PLC.
                      Use the Individual Operations tab to discover existing tags first.
                    </div>
                  </div>
                </div>

                {/* Batch Read Section */}
                <div className="batch-section">
                  <h3>📖 Batch Read Operations</h3>
                  <div className="batch-controls">
                    <div className="batch-input-section">
                      <label>Tag Names (one per line):</label>
                      <textarea
                        value={batchReadTags}
                        onChange={(e) => setBatchReadTags(e.target.value)}
                        placeholder="TestTag&#10;TestBool&#10;TestInt&#10;TestReal"
                        disabled={!isConnected}
                        className="batch-textarea"
                        rows={5}
                      />
                    </div>
                    <button
                      onClick={handleBatchRead}
                      disabled={!isConnected || isBatchReading}
                      className="btn btn-batch-read"
                    >
                      {isBatchReading ? <Activity className="spinning" size={16} /> : <Play size={16} />}
                      {isBatchReading ? 'Reading...' : 'Execute Batch Read'}
                    </button>
                  </div>

                  {/* Batch Read Results */}
                  {batchReadResult && (
                    <div className="batch-results">
                      <h4>📊 Batch Read Results</h4>
                      {batchReadResult.success ? (
                        <>
                          <div className="performance-summary">
                            <span className="perf-metric">
                              ✅ Success: {batchReadResult.performance?.successCount}/{Object.keys(batchReadResult.results || {}).length}
                            </span>
                            <span className="perf-metric">
                              ⏱️ Time: {batchReadResult.performance?.totalTimeMs}ms
                            </span>
                            <span className="perf-metric">
                              🚀 Rate: {batchReadResult.performance?.tagsPerSecond.toFixed(1)} tags/sec
                            </span>
                          </div>
                          <div className="results-table">
                            <table className="batch-results-table">
                              <thead>
                                <tr>
                                  <th>Tag Name</th>
                                  <th>Value</th>
                                  <th>Type</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(batchReadResult.results || {}).map(([tagName, result]) => (
                                  <tr key={tagName} className={result.success ? 'success-row' : 'error-row'}>
                                    <td>{tagName}</td>
                                    <td>{result.success ? String(result.value) : '-'}</td>
                                    <td>{result.dataType || '-'}</td>
                                    <td>
                                      {result.success ? (
                                        <span className="status-success">✅ Success</span>
                                      ) : (
                                        <span className="status-error">❌ {result.errorMessage}</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="error-message">❌ {batchReadResult.errorMessage}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Batch Write Section */}
                <div className="batch-section">
                  <h3>✏️ Batch Write Operations</h3>
                  <div className="batch-controls">
                    <div className="batch-input-section">
                      <label>Tag=Value pairs (one per line):</label>
                      <textarea
                        value={batchWriteData}
                        onChange={(e) => setBatchWriteData(e.target.value)}
                        placeholder="TestTag=true&#10;TestBool=false&#10;TestInt=999&#10;TestReal=88.8"
                        disabled={!isConnected}
                        className="batch-textarea"
                        rows={5}
                      />
                    </div>
                    <button
                      onClick={handleBatchWrite}
                      disabled={!isConnected || isBatchWriting}
                      className="btn btn-batch-write"
                    >
                      {isBatchWriting ? <Activity className="spinning" size={16} /> : <Play size={16} />}
                      {isBatchWriting ? 'Writing...' : 'Execute Batch Write'}
                    </button>
                  </div>

                  {/* Batch Write Results */}
                  {batchWriteResult && (
                    <div className="batch-results">
                      <h4>📊 Batch Write Results</h4>
                      {batchWriteResult.success ? (
                        <>
                          <div className="performance-summary">
                            <span className="perf-metric">
                              ✅ Success: {batchWriteResult.performance?.successCount}/{Object.keys(batchWriteResult.results || {}).length}
                            </span>
                            <span className="perf-metric">
                              ⏱️ Time: {batchWriteResult.performance?.totalTimeMs}ms
                            </span>
                            <span className="perf-metric">
                              🚀 Rate: {batchWriteResult.performance?.tagsPerSecond.toFixed(1)} tags/sec
                            </span>
                          </div>
                          <div className="results-table">
                            <table className="batch-results-table">
                              <thead>
                                <tr>
                                  <th>Tag Name</th>
                                  <th>Status</th>
                                  <th>Error Message</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(batchWriteResult.results || {}).map(([tagName, result]) => (
                                  <tr key={tagName} className={result.success ? 'success-row' : 'error-row'}>
                                    <td>{tagName}</td>
                                    <td>
                                      {result.success ? (
                                        <span className="status-success">✅ Success</span>
                                      ) : (
                                        <span className="status-error">❌ Failed</span>
                                      )}
                                    </td>
                                    <td>{result.errorMessage || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="error-message">❌ {batchWriteResult.errorMessage}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mixed Operations Section */}
                <div className="batch-section">
                  <h3>🔄 Mixed Batch Operations</h3>
                  <div className="batch-controls">
                    <div className="batch-input-section">
                      <label>Mixed operations (read:TagName or write:TagName=Value):</label>
                      <textarea
                        value={mixedOperations}
                        onChange={(e) => setMixedOperations(e.target.value)}
                        placeholder="read:TestTag&#10;read:TestBool&#10;write:TestInt=777&#10;write:TestReal=99.9"
                        disabled={!isConnected}
                        className="batch-textarea"
                        rows={5}
                      />
                    </div>
                    <button
                      onClick={handleMixedOperations}
                      disabled={!isConnected || isMixedExecuting}
                      className="btn btn-batch-mixed"
                    >
                      {isMixedExecuting ? <Activity className="spinning" size={16} /> : <Play size={16} />}
                      {isMixedExecuting ? 'Executing...' : 'Execute Mixed Batch'}
                    </button>
                  </div>

                  {/* Mixed Operations Results */}
                  {mixedResult && (
                    <div className="batch-results">
                      <h4>📊 Mixed Batch Results</h4>
                      {mixedResult.success ? (
                        <>
                          <div className="performance-summary">
                            <span className="perf-metric">
                              ✅ Success: {mixedResult.performance?.successCount}/{mixedResult.results?.length || 0}
                            </span>
                            <span className="perf-metric">
                              ⏱️ Time: {mixedResult.performance?.totalTimeMs}ms
                            </span>
                            <span className="perf-metric">
                              🚀 Rate: {mixedResult.performance?.operationsPerSecond.toFixed(1)} ops/sec
                            </span>
                          </div>
                          <div className="results-table">
                            <table className="batch-results-table">
                              <thead>
                                <tr>
                                  <th>Tag Name</th>
                                  <th>Operation</th>
                                  <th>Value</th>
                                  <th>Time (ms)</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mixedResult.results?.map((result, index) => (
                                  <tr key={index} className={result.success ? 'success-row' : 'error-row'}>
                                    <td>{result.tagName}</td>
                                    <td>{result.isWrite ? '✏️ Write' : '📖 Read'}</td>
                                    <td>{result.value !== undefined ? String(result.value) : '-'}</td>
                                    <td>{result.executionTimeMs.toFixed(2)}</td>
                                    <td>
                                      {result.success ? (
                                        <span className="status-success">✅ Success</span>
                                      ) : (
                                        <span className="status-error">❌ {result.errorMessage}</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="error-message">❌ {mixedResult.errorMessage}</div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <section className="panel performance-panel">
                <h2>📈 Performance Testing & Statistics</h2>

                {/* Batch Benchmark Section */}
                <div className="performance-section">
                  <h3>🏁 Batch vs Individual Performance Benchmark</h3>
                  <div className="benchmark-controls">
                    <button
                      onClick={handleBatchBenchmark}
                      disabled={!isConnected || isBatchBenchmarking}
                      className="btn btn-benchmark-batch"
                    >
                      {isBatchBenchmarking ? <Activity className="spinning" size={16} /> : <BarChart3 size={16} />}
                      {isBatchBenchmarking ? 'Running Benchmark...' : 'Run Batch Benchmark'}
                    </button>
                    <p className="benchmark-description">
                      Compares performance of 10 mixed operations using individual vs batch methods.
                    </p>
                  </div>

                  {/* Benchmark Results */}
                  {batchBenchmarkResult && (
                    <div className="benchmark-results">
                      <h4>🏆 Benchmark Results</h4>
                      <div className="benchmark-comparison">
                        <div className="comparison-card">
                          <h5>Individual Operations</h5>
                          <div className="metric-large">{batchBenchmarkResult.individualTotalTimeMs}ms</div>
                          <div className="metric-small">{batchBenchmarkResult.individualAverageTimeMs.toFixed(2)}ms avg</div>
                          <div className="metric-small">{batchBenchmarkResult.individualSuccessCount} successful</div>
                        </div>
                        <div className="comparison-arrow">
                          <div className="speedup-factor">
                            {batchBenchmarkResult.speedupFactor.toFixed(1)}x faster
                          </div>
                          <div className="time-saved">
                            Saved {batchBenchmarkResult.timeSavedMs}ms ({batchBenchmarkResult.timeSavedPercentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="comparison-card batch-card">
                          <h5>Batch Operations</h5>
                          <div className="metric-large">{batchBenchmarkResult.batchTotalTimeMs}ms</div>
                          <div className="metric-small">{batchBenchmarkResult.batchAverageTimeMs.toFixed(2)}ms avg</div>
                          <div className="metric-small">{batchBenchmarkResult.batchSuccessCount} successful</div>
                        </div>
                      </div>
                      <div className="network-efficiency">
                        <strong>Network Efficiency:</strong> {batchBenchmarkResult.networkEfficiencyFactor}x fewer packets
                      </div>
                    </div>
                  )}
                </div>

                {/* Batch Statistics Section */}
                <div className="performance-section">
                  <h3>📊 Batch Operation Statistics</h3>
                  <div className="stats-controls">
                    <button
                      onClick={handleGetBatchStats}
                      disabled={!isConnected}
                      className="btn btn-get-stats"
                    >
                      📊 Get Statistics
                    </button>
                    <button
                      onClick={handleResetBatchStats}
                      disabled={!isConnected}
                      className="btn btn-reset-stats"
                    >
                      <RotateCcw size={16} />
                      Reset Statistics
                    </button>
                  </div>

                  {/* Statistics Display */}
                  {batchStats && (
                    <div className="stats-display">
                      <h4>📈 Operation Statistics</h4>
                      <div className="stats-table">
                        <table className="performance-table">
                          <thead>
                            <tr>
                              <th>Operation Type</th>
                              <th>Total Ops</th>
                              <th>Success Rate</th>
                              <th>Avg Time/Op</th>
                              <th>Last Executed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(batchStats).map(([opType, stats]) => (
                              <tr key={opType}>
                                <td>{opType}</td>
                                <td>{stats.totalOperations}</td>
                                <td>{stats.successRate.toFixed(1)}%</td>
                                <td>{stats.averageTimePerOperation.toFixed(2)}ms</td>
                                <td>{new Date(stats.lastExecuted).toLocaleTimeString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Configuration Tab */}
            {activeTab === 'config' && (
              <section className="panel config-panel">
                <h2>⚙️ Batch Operation Configuration</h2>

                {/* Configuration Presets */}
                <div className="config-section">
                  <h3>🎛️ Configuration Presets</h3>
                  <div className="preset-buttons">
                    <button
                      onClick={() => handleConfigureBatch('default')}
                      disabled={!isConnected || isConfiguring}
                      className="btn btn-preset-default"
                    >
                      📊 Default
                      <small>20 ops/packet, 504 bytes</small>
                    </button>
                    <button
                      onClick={() => handleConfigureBatch('highPerformance')}
                      disabled={!isConnected || isConfiguring}
                      className="btn btn-preset-performance"
                    >
                      🚀 High Performance
                      <small>50 ops/packet, 4000 bytes</small>
                    </button>
                    <button
                      onClick={() => handleConfigureBatch('conservative')}
                      disabled={!isConnected || isConfiguring}
                      className="btn btn-preset-conservative"
                    >
                      🛡️ Conservative
                      <small>10 ops/packet, 504 bytes</small>
                    </button>
                  </div>
                </div>

                {/* Current Configuration Display */}
                <div className="config-section">
                  <h3>📋 Current Configuration</h3>
                  <div className="config-display">
                    <div className="config-grid">
                      <div className="config-item">
                        <label>Max Operations per Packet:</label>
                        <span className="config-value">{batchConfig.maxOperationsPerPacket}</span>
                      </div>
                      <div className="config-item">
                        <label>Max Packet Size:</label>
                        <span className="config-value">{batchConfig.maxPacketSize} bytes</span>
                      </div>
                      <div className="config-item">
                        <label>Packet Timeout:</label>
                        <span className="config-value">{batchConfig.packetTimeoutMs}ms</span>
                      </div>
                      <div className="config-item">
                        <label>Continue on Error:</label>
                        <span className="config-value">{batchConfig.continueOnError ? '✅ Yes' : '❌ No'}</span>
                      </div>
                      <div className="config-item">
                        <label>Optimize Packet Packing:</label>
                        <span className="config-value">{batchConfig.optimizePacketPacking ? '✅ Yes' : '❌ No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Guidelines */}
                <div className="config-section">
                  <h3>💡 Configuration Guidelines</h3>
                  <div className="guidelines">
                    <div className="guideline-item">
                      <h4>🚀 High Performance</h4>
                      <p>Use for modern PLCs with fast networks. Maximizes throughput with larger packets.</p>
                      <ul>
                        <li>CompactLogix L3x series and newer</li>
                        <li>Gigabit Ethernet networks</li>
                        <li>Low network latency environments</li>
                      </ul>
                    </div>
                    <div className="guideline-item">
                      <h4>📊 Default</h4>
                      <p>Balanced configuration suitable for most industrial applications.</p>
                      <ul>
                        <li>CompactLogix L2x/L3x series</li>
                        <li>Standard 100Mbps networks</li>
                        <li>Mixed PLC environments</li>
                      </ul>
                    </div>
                    <div className="guideline-item">
                      <h4>🛡️ Conservative</h4>
                      <p>Use for older PLCs or unreliable networks. Prioritizes reliability over speed.</p>
                      <ul>
                        <li>MicroLogix and older CompactLogix</li>
                        <li>Wireless or high-latency networks</li>
                        <li>Critical safety applications</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
