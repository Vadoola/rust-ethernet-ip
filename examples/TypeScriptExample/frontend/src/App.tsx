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

  // Tag monitoring
  const [monitoredTags, setMonitoredTags] = useState<PlcTag[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Logging
  const [logs, setLogs] = useState<LogEntry[]>([]);

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
    if (!plcAddress.trim()) {
      addLog('error', 'Please enter a PLC address');
      return;
    }

    setIsConnecting(true);
    addLog('info', `🔌 Connecting to PLC at ${plcAddress}...`);

    try {
      const result = await plcApi.connect(plcAddress);
      if (result.success) {
        setIsConnected(true);
        addLog('success', `✅ Connected successfully! ${result.message || ''}`);
        await updateStatus();
      } else {
        addLog('error', `❌ Connection failed: ${result.message}`);
      }
    } catch (error) {
      addLog('error', `❌ Connection error: ${error}`);
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
      addLog('info', '📤 Disconnected from PLC');
    } catch (error) {
      addLog('error', `⚠️ Disconnect error: ${error}`);
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

    try {
      const tag = await plcApi.discoverTag(tagToDiscover);
      if (tag) {
        setSelectedTag(tag);
        setTagValue(String(tag.value));
        setSelectedDataType(tag.type);
        addLog('success', `✅ Discovered ${tag.type} tag: ${tag.name} = ${tag.value}`);
      } else {
        addLog('error', `❌ Could not determine type for tag: ${tagToDiscover}`);
      }
    } catch (error) {
      addLog('error', `❌ Discovery error: ${error}`);
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
    addLog('info', '📊 Running performance benchmark...');

    try {
      const result = await plcApi.runBenchmark();
      if (result.success) {
        setBenchmarkResults({
          readRate: result.readRate,
          writeRate: result.writeRate
        });
        addLog('success', `✅ Benchmark complete: ${result.readRate} reads/sec, ${result.writeRate} writes/sec`);
      } else {
        addLog('error', `❌ Benchmark error: ${result.message}`);
      }
    } catch (error) {
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
              <label>PLC Address:</label>
              <input
                type="text"
                value={plcAddress}
                onChange={(e) => setPlcAddress(e.target.value)}
                placeholder="192.168.0.1:44818"
                disabled={isConnected}
              />
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
                <div className="metric">
                  <span className="metric-label">📝 Write Rate:</span>
                  <span className="metric-value">{benchmarkResults.writeRate} ops/sec</span>
                </div>
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
