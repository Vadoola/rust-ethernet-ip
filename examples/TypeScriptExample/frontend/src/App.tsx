import { useState, useEffect, useCallback } from 'react';
import { 
  plcApi, 
  type PlcTag, 
  type PlcDataType, 
  type PlcStatus,
  DATA_TYPE_INFO,
  ADVANCED_TAG_EXAMPLES 
} from './api/plcApi';
import { 
  Activity, 
  Cpu, 
  Database, 
  Play, 
  Square, 
  Search, 
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  BarChart3
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

  // Add log entry
  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

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
        setConnectionStatus(result.status);
        setIsConnected(result.status.isConnected);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
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

  // Read tag
  const handleReadTag = async () => {
    if (!selectedTag?.name) {
      addLog('error', 'Please select a tag to read');
      return;
    }

    setIsReading(true);
    addLog('info', `📖 Reading tag: ${selectedTag.name}`);

    try {
      const result = await plcApi.readTag(selectedTag.name);
      if (result.success) {
        setTagValue(String(result.value));
        setSelectedDataType(result.type);
        addLog('success', `✅ Read ${result.type} tag: ${selectedTag.name} = ${result.value}`);
      } else {
        addLog('error', `❌ Read error: ${result.message}`);
      }
    } catch (error) {
      addLog('error', `❌ Read error: ${error}`);
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
        setMonitoredTags(updatedTags);
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isConnected, isMonitoring, monitoredTags]);

  // Status update interval
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
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
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <Cpu className="header-icon" />
            <h1>🦀 Rust EtherNet/IP - TypeScript Dashboard</h1>
          </div>
          <div className="header-status">
            {isConnected ? (
              <div className="status-connected">
                <CheckCircle size={20} />
                <span>Connected</span>
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
        {/* Connection Panel */}
        <section className="panel connection-panel">
          <h2><Database size={20} /> Connection</h2>
          <div className="connection-controls">
            <div className="input-group">
              <label>
                PLC Address:
                {isConnected && <span className="input-disabled-note"> (disconnect to edit)</span>}
              </label>
              <div className="input-with-reset">
                <input
                  type="text"
                  value={plcAddress}
                  onChange={handleAddressChange}
                  onFocus={() => console.log('🎯 Input focused, state:', { plcAddress, isConnected, isConnecting })}
                  onBlur={() => console.log('🎯 Input blurred')}
                  placeholder="192.168.0.1:44818"
                  disabled={isConnected || isConnecting}
                  className={isConnected || isConnecting ? 'input-disabled' : ''}
                  title={isConnected ? "Disconnect first to change address" : "Enter PLC IP address and port"}
                  key={`plc-address-input-${componentKey}`}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setPlcAddress('192.168.0.1:44818')}
                  disabled={isConnected || isConnecting}
                  className="btn btn-small btn-outline reset-btn"
                  title="Reset to default address"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setPlcAddress('')}
                  disabled={isConnected || isConnecting}
                  className="btn btn-small btn-outline clear-btn"
                  title="Clear address field"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleCompleteReset}
                  className="btn btn-small btn-danger reset-btn"
                  title="Force complete application reset"
                >
                  Force Reset
                </button>
              </div>
            </div>
            <div className="button-group">
              <button
                onClick={handleConnect}
                disabled={isConnected || isConnecting}
                className="btn btn-primary"
              >
                {isConnecting ? <Activity className="spinning" size={16} /> : <Play size={16} />}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="btn btn-secondary"
              >
                <Square size={16} />
                Disconnect
              </button>
            </div>
          </div>
          
          {connectionStatus && (
            <div className="connection-info">
              <p><strong>Address:</strong> {connectionStatus.address}</p>
              <p><strong>Status:</strong> {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}</p>
            </div>
          )}

          {/* Debug Information */}
          <div className="debug-info" style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            background: '#f8f9fa', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          }}>
            <strong>🐛 Debug Info:</strong><br/>
            • plcAddress: "{plcAddress}" (length: {plcAddress.length})<br/>
            • isConnected: {isConnected.toString()}<br/>
            • isConnecting: {isConnecting.toString()}<br/>
            • inputDisabled: {(isConnected || isConnecting).toString()}
          </div>
        </section>

        {/* Tag Operations Panel */}
        <section className="panel tag-panel">
          <h2><Settings size={20} /> Tag Operations</h2>
          
          {/* Tag Discovery */}
          <div className="tag-section">
            <h3>🔍 Tag Discovery</h3>
            <div className="tag-discovery">
              <div className="input-group">
                <input
                  type="text"
                  value={tagToDiscover}
                  onChange={(e) => setTagToDiscover(e.target.value)}
                  placeholder="Enter tag name to discover"
                  disabled={!isConnected}
                />
                <button
                  onClick={handleDiscoverTag}
                  disabled={!isConnected || isDiscovering}
                  className="btn btn-primary"
                >
                  {isDiscovering ? <Activity className="spinning" size={16} /> : <Search size={16} />}
                  Discover
                </button>
              </div>
              
              <div className="tag-examples">
                <p><strong>Advanced Tag Examples:</strong></p>
                <div className="example-tags">
                  {ADVANCED_TAG_EXAMPLES.slice(0, 5).map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setTagToDiscover(example)}
                      className="btn btn-outline btn-small"
                      disabled={!isConnected}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tag Read/Write */}
          {selectedTag && (
            <div className="tag-section">
              <h3>📖 Tag Operations</h3>
              <div className="tag-operations">
                <div className="tag-info">
                  <p><strong>Tag:</strong> {selectedTag.name}</p>
                  <p><strong>Type:</strong> {selectedTag.type}</p>
                  <p><strong>Last Updated:</strong> {selectedTag.lastUpdated}</p>
                </div>
                
                <div className="tag-controls">
                  <div className="input-group">
                    <label>Data Type:</label>
                    <select
                      value={selectedDataType}
                      onChange={(e) => setSelectedDataType(e.target.value as PlcDataType)}
                      disabled={!isConnected}
                    >
                      {Object.entries(DATA_TYPE_INFO).map(([type, info]) => (
                        <option key={type} value={type}>
                          {type} - {info.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label>Value:</label>
                    <input
                      type="text"
                      value={tagValue}
                      onChange={(e) => setTagValue(e.target.value)}
                      placeholder="Enter value"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <div className="button-group">
                    <button
                      onClick={handleReadTag}
                      disabled={!isConnected || isReading}
                      className="btn btn-success"
                    >
                      {isReading ? <Activity className="spinning" size={16} /> : <Database size={16} />}
                      Read
                    </button>
                    <button
                      onClick={handleWriteTag}
                      disabled={!isConnected || isWriting}
                      className="btn btn-warning"
                    >
                      {isWriting ? <Activity className="spinning" size={16} /> : <Zap size={16} />}
                      Write
                    </button>
                    <button
                      onClick={addTagToMonitoring}
                      disabled={!isConnected}
                      className="btn btn-info"
                    >
                      <BarChart3 size={16} />
                      Monitor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Performance Panel */}
        <section className="panel performance-panel">
          <h2><BarChart3 size={20} /> Performance</h2>
          <div className="performance-controls">
            <div className="input-group">
              <label>Test Tag (optional):</label>
              <input
                type="text"
                value={benchmarkTestTag}
                onChange={(e) => setBenchmarkTestTag(e.target.value)}
                placeholder="Leave empty to use selected tag or TestTag"
                disabled={!isConnected || isRunningBenchmark}
              />
              <small style={{ color: '#718096', fontSize: '0.75rem' }}>
                💡 Use a tag that exists in your PLC for accurate results
              </small>
            </div>
            
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={benchmarkTestWrites}
                  onChange={(e) => setBenchmarkTestWrites(e.target.checked)}
                  disabled={!isConnected || isRunningBenchmark}
                />
                Test write operations (requires writable tag)
              </label>
            </div>
            
            <button
              onClick={handleRunBenchmark}
              disabled={!isConnected || isRunningBenchmark}
              className="btn btn-primary"
            >
              {isRunningBenchmark ? <Activity className="spinning" size={16} /> : <Zap size={16} />}
              {isRunningBenchmark ? 'Running Benchmark...' : 'Run Benchmark'}
            </button>
            
            {benchmarkResults && (
              <div className="benchmark-results">
                <div className="metric">
                  <span className="metric-label">📊 Read Rate:</span>
                  <span className="metric-value">{benchmarkResults.readRate} ops/sec</span>
                </div>
                {benchmarkTestWrites && (
                  <div className="metric">
                    <span className="metric-label">📝 Write Rate:</span>
                    <span className="metric-value">{benchmarkResults.writeRate} ops/sec</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Tag Monitoring Panel */}
        {monitoredTags.length > 0 && (
          <section className="panel monitoring-panel">
            <h2><Activity size={20} /> Tag Monitoring</h2>
            <div className="monitoring-controls">
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                disabled={!isConnected}
                className={`btn ${isMonitoring ? 'btn-warning' : 'btn-success'}`}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
            
            <div className="monitored-tags">
              {monitoredTags.map((tag, index) => (
                <div key={index} className={`tag-monitor ${tag.hasError ? 'error' : ''}`}>
                  <div className="tag-monitor-header">
                    <span className="tag-name">{tag.name}</span>
                    <span className="tag-type">{tag.type}</span>
                    <button
                      onClick={() => removeTagFromMonitoring(tag.name)}
                      className="btn btn-small btn-danger"
                    >
                      ×
                    </button>
                  </div>
                  <div className="tag-monitor-value">
                    {tag.hasError ? (
                      <span className="error-text">{tag.errorMessage}</span>
                    ) : (
                      <span className="value-text">{String(tag.value)}</span>
                    )}
                  </div>
                  <div className="tag-monitor-time">
                    <Clock size={12} />
                    {tag.lastUpdated}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Log Panel */}
        <section className="panel log-panel">
          <h2><Activity size={20} /> Activity Log</h2>
          <div className="log-container">
            {logs.map((log) => (
              <div key={log.id} className={`log-entry log-${log.level}`}>
                <span className="log-timestamp">[{log.timestamp}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
