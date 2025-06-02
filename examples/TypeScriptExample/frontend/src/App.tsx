import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  plcApi, 
  type PlcTag, 
  type PlcDataType, 
  type PlcStatus,
  DATA_TYPE_INFO
} from './api/plcApi';
import { 
  Activity, 
  Cpu, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import './App.css';

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

  // Tag operations
  const [tagToDiscover, setTagToDiscover] = useState('');
  const [selectedTag, setSelectedTag] = useState<PlcTag | null>(null);
  const [tagValue, setTagValue] = useState('');
  const [selectedDataType, setSelectedDataType] = useState<PlcDataType>('BOOL');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // Performance monitoring
  const [benchmarkResults, setBenchmarkResults] = useState<{ readRate: number; writeRate: number } | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkTestTag, setBenchmarkTestTag] = useState('');
  const [benchmarkTestWrites, setBenchmarkTestWrites] = useState(false);

  // Tag monitoring
  const [monitoredTags, setMonitoredTags] = useState<PlcTag[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Logging
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Add a key to force component remount when needed
  const [componentKey, setComponentKey] = useState(0);
  
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
      addLog('warning', '⚠️ No test tag specified. Using default "TestTag" which may not exist.');
      addLog('info', '💡 Tip: First discover a tag, then run benchmark for better results');
    } else {
      addLog('info', `📊 Running benchmark with tag: ${testTag}`);
    }
    
    addLog('info', `🔧 Test writes: ${benchmarkTestWrites ? 'enabled' : 'disabled'}`);

    try {
      const result = await plcApi.runBenchmark(testTag || undefined, benchmarkTestWrites, 5);
      console.log('📊 Benchmark result:', result);
      
      if (result.success) {
        setBenchmarkResults({
          readRate: result.readRate,
          writeRate: result.writeRate
        });
        addLog('success', `✅ ${result.message}`);
        
        // Log additional details if available
        if (result.details) {
          addLog('info', `📈 Details: ${result.details.readCount} reads, ${result.details.writeCount} writes in ${result.details.durationSeconds.toFixed(1)}s`);
          if (result.details.readErrors > 0 || result.details.writeErrors > 0) {
            addLog('warning', `⚠️ Errors: ${result.details.readErrors} read errors, ${result.details.writeErrors} write errors`);
          }
          if (!result.details.tagExists) {
            addLog('warning', `⚠️ Test tag "${result.details.testTag}" may not exist in PLC`);
            addLog('info', '💡 Try using a tag name that exists in your PLC for accurate results');
          }
        }
      } else {
        addLog('error', `❌ Benchmark error: ${result.message}`);
      }
    } catch (error) {
      console.error('📊 Benchmark error:', error);
      addLog('error', `❌ Benchmark error: ${error}`);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // Add tag to monitoring
  const addTagToMonitoring = () => {
    if (!selectedTag) return;
    
    const exists = monitoredTags.some(tag => tag.name === selectedTag.name);
    if (!exists) {
      setMonitoredTags(prev => [...prev, selectedTag]);
      addLog('info', `📊 Added ${selectedTag.name} to monitoring`);
    }
  };

  // Remove tag from monitoring
  const removeTagFromMonitoring = (tagName: string) => {
    setMonitoredTags(prev => prev.filter(tag => tag.name !== tagName));
    addLog('info', `🗑️ Removed ${tagName} from monitoring`);
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

  // Complete state reset function
  const handleCompleteReset = () => {
    console.log('🔄 Complete state reset triggered');
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus(null);
    setPlcAddress('192.168.0.1:44818');
    setTagToDiscover('');
    setSelectedTag(null);
    setTagValue('');
    setSelectedDataType('BOOL');
    setMonitoredTags([]);
    setIsMonitoring(false);
    setBenchmarkResults(null);
    setComponentKey(prev => prev + 1); // Force component remount
    addLog('info', '🔄 Complete application state reset');
  };

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

  return (
    <div className="app" key={componentKey}>
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
          <button
            onClick={handleRunBenchmark}
            disabled={!isConnected || isRunningBenchmark}
            className="btn btn-benchmark"
          >
            {isRunningBenchmark ? <Activity className="spinning" size={16} /> : '⚡'}
            {isRunningBenchmark ? 'Running...' : 'Run Benchmark'}
          </button>
        </section>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Tag Monitoring Panel */}
          <section className="panel tag-monitoring-panel">
            <h2>📊 Tag Monitoring</h2>
            
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
                      {Object.entries(DATA_TYPE_INFO).map(([type, info]) => (
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
                    <tr key={tag.name} className={tag.hasError ? 'error-row' : ''}>
                      <td>{tag.name}</td>
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
      </main>
    </div>
  );
}

export default App;
