"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  connectToPlc,
  disconnectPlc,
  readTag,
  writeTag,
  batchReadTags,
  batchWriteTags,
  runBenchmark,
  getPlcStatus,
  createTestTags,
  discoverTag,
  debugReadTag
} from "../lib/plcApi";
import "./globals.css";

// Tab type definition
const TABS = ["Individual", "Batch", "Performance", "HMI Demo", "Config", "About"] as const;
type TabType = typeof TABS[number];

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

const PLC_TYPES = [
  { label: 'Bool', value: 'Bool' },
  { label: 'Int', value: 'Int' },
  { label: 'Dint', value: 'Dint' },
  { label: 'Real', value: 'Real' },
  { label: 'String', value: 'String' },
];

export default function Page() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [plcAddress, setPlcAddress] = useState("192.168.0.1:44818");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionIssues, setConnectionIssues] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>("Individual");

  // Individual tag operations
  const [tagName, setTagName] = useState("");
  const [tagType, setTagType] = useState("String");
  const [tagValue, setTagValue] = useState("");
  const [readValue, setReadValue] = useState<string | number | boolean | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDebugReading, setIsDebugReading] = useState(false);

  // Tag monitoring
  const [monitoredTags, setMonitoredTags] = useState<Array<{id: string, name: string, type: string, value: any, lastUpdate: string, error?: string}>>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState(50); // 50ms = 20 updates per second
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringIntervalValueRef = useRef(50);
  const monitoredTagsRef = useRef<Array<{id: string, name: string, type: string, value: any, lastUpdate: string, error?: string}>>([]);
  const [newMonitorTag, setNewMonitorTag] = useState("");
  const [newMonitorType, setNewMonitorType] = useState("String");

  // Batch operations
  const [batchTags, setBatchTags] = useState<string>(
    "TestTag:Bool\nTestBool:Bool\nTestInt:Dint\nTestReal:Real\nTestString:String"
  );
  const [batchReadResult, setBatchReadResult] = useState<any>(null);
  const [batchWriteData, setBatchWriteData] = useState<string>(
    "TestTag:Bool=true\nTestBool:Bool=false\nTestInt:Dint=999\nTestReal:Real=88.8\nTestString:String=Hello PLC"
  );
  const [batchWriteResult, setBatchWriteResult] = useState<any>(null);
  const [isBatchReading, setIsBatchReading] = useState(false);
  const [isBatchWriting, setIsBatchWriting] = useState(false);

  // Performance
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkTestTag, setBenchmarkTestTag] = useState("");
  const [benchmarkTestType, setBenchmarkTestType] = useState("Dint");
  const [benchmarkTestWrites, setBenchmarkTestWrites] = useState(false);

  // HMI Demo state
  const [hmiData, setHmiData] = useState({
    machineStatus: "Running",
    productionCount: 0,
    targetCount: 1000,
    cycleTime: 0,
    temperature: 0,
    pressure: 0,
    vibration: 0,
    qualityRate: 100,
    efficiency: 0,
    availability: 100,
    performance: 0,
    oee: 0,
    shift: 1,
    operator: "John Doe",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-02-15"
  });
  const [isHmiMonitoring, setIsHmiMonitoring] = useState(false);
  const hmiIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Logging
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logCounterRef = useRef(0);
  const addLog = useCallback((level: LogEntry["level"], message: string) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${logCounterRef.current}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setLogs((prev) => [logEntry, ...prev.slice(0, 99)]);
    logCounterRef.current += 1;
  }, []);

  // Connection handlers
  const handleConnect = async () => {
    setIsConnecting(true);
    addLog("info", `Connecting to PLC at ${plcAddress}...`);
    try {
      await connectToPlc(plcAddress);
      setIsConnected(true);
      setConnectionStatus("connected");
      addLog("success", `Connected to PLC at ${plcAddress}`);
    } catch (err: any) {
      setIsConnected(false);
      setConnectionStatus("error");
      addLog("error", `Failed to connect: ${err.message || err}`);
    } finally {
      setIsConnecting(false);
    }
  };
  const handleDisconnect = async () => {
    await disconnectPlc();
    setIsConnected(false);
    setConnectionStatus(null);
    addLog("info", "Disconnected from PLC");
  };

  // Individual tag handlers
  const handleReadTag = async () => {
    if (!tagName) return;
    setIsReading(true);
    addLog("info", `Reading tag: ${tagName} (type: ${tagType})`);
    try {
      const value = await readTag(tagName, tagType);
      setReadValue(value.value);
      addLog("success", `Read tag ${tagName}: ${value.value}`);
    } catch (err: any) {
      addLog("error", `Failed to read tag ${tagName}: ${err.message || err}`);
    } finally {
      setIsReading(false);
    }
  };
  const handleWriteTag = async () => {
    if (!tagName) return;
    setIsWriting(true);
    addLog("info", `Writing tag: ${tagName} = ${tagValue} (type: ${tagType})`);
    try {
      let valueToSend: any = tagValue;
      if (["Dint", "Int", "Real"].includes(tagType)) {
        valueToSend = Number(tagValue);
        if (isNaN(valueToSend)) throw new Error("Invalid number value");
      } else if (tagType === "Bool") {
        valueToSend = String(tagValue).toLowerCase() === "true";
      }
      await writeTag(tagName, valueToSend, tagType);
      addLog("success", `Wrote tag ${tagName}: ${valueToSend}`);
    } catch (err: any) {
      addLog("error", `Failed to write tag ${tagName}: ${err.message || err}`);
    } finally {
      setIsWriting(false);
    }
  };
  const handleDiscoverTag = async () => {
    if (!tagName) return;
    setIsDiscovering(true);
    addLog("info", `Discovering type for tag: ${tagName}`);
    try {
      const discoveredType = await discoverTag(tagName);
      setTagType(discoveredType);
      addLog("success", `Discovered type for tag ${tagName}: ${discoveredType}`);
    } catch (err: any) {
      addLog("error", `Failed to discover tag type for ${tagName}: ${err.message || err}`);
    } finally {
      setIsDiscovering(false);
    }
  };
  const handleDebugRead = async () => {
    if (!tagName) return;
    setIsDebugReading(true);
    addLog("info", `Debug reading tag: ${tagName} (type: ${tagType})`);
    try {
      const result = await debugReadTag(tagName, tagType);
      addLog("success", `Debug read result: ${JSON.stringify(result)}`);
    } catch (err: any) {
      addLog("error", `Debug read failed: ${err.message || err}`);
    } finally {
      setIsDebugReading(false);
    }
  };

  // Update refs whenever state changes
  useEffect(() => {
    monitoredTagsRef.current = monitoredTags;
  }, [monitoredTags]);

  useEffect(() => {
    monitoringIntervalValueRef.current = monitoringInterval;
  }, [monitoringInterval]);

  // Tag monitoring functions
  const addTagToMonitor = () => {
    if (!newMonitorTag.trim()) return;
    const newTag = {
      id: `${Date.now()}-${Math.random()}`,
      name: newMonitorTag.trim(),
      type: newMonitorType,
      value: null,
      lastUpdate: new Date().toLocaleTimeString(),
      error: undefined
    };
    setMonitoredTags(prev => [...prev, newTag]);
    setNewMonitorTag("");
    addLog("info", `Added tag to monitoring: ${newTag.name} (${newTag.type})`);
  };

  const removeTagFromMonitor = (id: string) => {
    const tag = monitoredTags.find(t => t.id === id);
    setMonitoredTags(prev => prev.filter(t => t.id !== id));
    if (tag) {
      addLog("info", `Removed tag from monitoring: ${tag.name}`);
    }
  };

  const stopMonitoring = () => {
    console.log("[MONITORING] Stopping monitoring...");
    setIsMonitoring(false);
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
      console.log("[MONITORING] Interval cleared");
    } else {
      console.log("[MONITORING] No interval to clear");
    }
    addLog("info", "Stopped tag monitoring");
  };

  const startMonitoring = () => {
    if (monitoredTags.length === 0) {
      addLog("warning", "No tags to monitor. Add some tags first.");
      return;
    }
    
    setIsMonitoring(true);
    addLog("info", `Started monitoring ${monitoredTags.length} tags (${monitoringInterval}ms interval)`);
  };

  // Simple monitoring effect
  useEffect(() => {
    if (!isMonitoring || !isConnected) {
      return;
    }

    console.log(`[MONITORING] Starting monitoring effect`);

    const updateTags = async () => {
      console.log(`[MONITORING] updateTags called at ${new Date().toLocaleTimeString()}`);
      
      if (!isConnected) {
        console.log("[MONITORING] Not connected, skipping update");
        return;
      }
      
      // Get current tags from ref to avoid dependency issues
      const currentTags = monitoredTagsRef.current;
      if (currentTags.length === 0) {
        console.log("[MONITORING] No tags to monitor");
        return;
      }
      
      console.log(`[MONITORING] Updating ${currentTags.length} tags`);
      const timestamp = new Date().toLocaleTimeString();
      
      const updatePromises = currentTags.map(async (tag) => {
        try {
          const result = await readTag(tag.name, tag.type);
          console.log(`[MONITORING] Tag ${tag.name}: ${result.value}`);
          return {
            ...tag,
            value: result.value,
            lastUpdate: timestamp,
            error: undefined
          };
        } catch (err: any) {
          console.log(`[MONITORING] Error reading tag ${tag.name}:`, err.message);
          return {
            ...tag,
            error: err.message || "Read failed",
            lastUpdate: timestamp
          };
        }
      });

      const updatedTags = await Promise.all(updatePromises);
      setMonitoredTags(updatedTags);
      console.log("[MONITORING] Tags updated successfully");
    };

    // Initial update
    console.log("[MONITORING] Running initial update");
    updateTags();
    
    // Set up interval
    console.log(`[MONITORING] Setting up interval with ${monitoringInterval}ms`);
    monitoringIntervalRef.current = setInterval(updateTags, monitoringInterval);
    
    if (monitoringIntervalRef.current) {
      console.log("[MONITORING] Interval set successfully");
    } else {
      console.error("[MONITORING] Failed to set interval");
    }

    // Cleanup function
    return () => {
      console.log("[MONITORING] Cleaning up monitoring effect");
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
    };
  }, [isMonitoring, isConnected, monitoringInterval, readTag]);


  const restartMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
      // Use setTimeout to restart after stopMonitoring completes
      setTimeout(() => {
        startMonitoring();
      }, 100);
    }
  };

  // Cleanup monitoring on unmount or disconnect
  useEffect(() => {
    if (!isConnected && isMonitoring) {
      stopMonitoring();
    }
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [isConnected, isMonitoring]);

  // HMI Demo functions
  const startHmiMonitoring = async () => {
    if (!isConnected) {
      addLog("warning", "Please connect to PLC first");
      return;
    }

    setIsHmiMonitoring(true);
    addLog("info", "Starting HMI demo monitoring...");

    const updateHmiData = async () => {
      try {
        // Read all HMI tags from PLC
        const [
          machineStatusResult,
          productionCountResult,
          targetCountResult,
          cycleTimeResult,
          temperatureResult,
          pressureResult,
          vibrationResult,
          qualityRateResult,
          efficiencyResult,
          availabilityResult,
          performanceResult,
          shiftResult,
          operatorResult
        ] = await Promise.all([
          readTag("HMI_Machine_Status", "String"),
          readTag("HMI_Production_Count", "Dint"),
          readTag("HMI_Target_Count", "Dint"),
          readTag("HMI_Cycle_Time", "Real"),
          readTag("HMI_Temperature", "Real"),
          readTag("HMI_Pressure", "Real"),
          readTag("HMI_Vibration", "Real"),
          readTag("HMI_Quality_Rate", "Real"),
          readTag("HMI_Efficiency", "Real"),
          readTag("HMI_Availability", "Real"),
          readTag("HMI_Performance", "Real"),
          readTag("HMI_Shift", "Int"),
          readTag("HMI_Operator", "String")
        ]);

        // Calculate OEE (Overall Equipment Effectiveness)
        const availability = Number(availabilityResult.value) || 0;
        const performance = Number(performanceResult.value) || 0;
        const quality = Number(qualityRateResult.value) || 0;
        const oee = (availability * performance * quality) / 10000; // Convert to percentage

        setHmiData(prev => ({
          ...prev,
          machineStatus: String(machineStatusResult.value) || "Unknown",
          productionCount: Number(productionCountResult.value) || 0,
          targetCount: Number(targetCountResult.value) || 1000,
          cycleTime: Number(cycleTimeResult.value) || 0,
          temperature: Number(temperatureResult.value) || 0,
          pressure: Number(pressureResult.value) || 0,
          vibration: Number(vibrationResult.value) || 0,
          qualityRate: Number(qualityRateResult.value) || 100,
          efficiency: Number(efficiencyResult.value) || 0,
          availability: availability,
          performance: performance,
          oee: oee,
          shift: Number(shiftResult.value) || 1,
          operator: String(operatorResult.value) || "Unknown"
        }));

      } catch (err: any) {
        addLog("error", `HMI data update failed: ${err.message}`);
        console.error("HMI update error:", err);
      }
    };

    // Initial update
    await updateHmiData();

    // Set up interval for continuous updates
    hmiIntervalRef.current = setInterval(updateHmiData, 1000); // Update every second
  };

  const stopHmiMonitoring = () => {
    setIsHmiMonitoring(false);
    if (hmiIntervalRef.current) {
      clearInterval(hmiIntervalRef.current);
      hmiIntervalRef.current = null;
    }
    addLog("info", "Stopped HMI demo monitoring");
  };

  // Cleanup HMI monitoring on unmount or disconnect
  useEffect(() => {
    if (!isConnected && isHmiMonitoring) {
      stopHmiMonitoring();
    }
    return () => {
      if (hmiIntervalRef.current) {
        clearInterval(hmiIntervalRef.current);
      }
    };
  }, [isConnected, isHmiMonitoring]);

  // Batch handlers
  const handleBatchRead = async () => {
    setIsBatchReading(true);
    // Parse lines as TagName:Type
    const tags = batchTags.split("\n").map((t) => t.trim()).filter(Boolean);
    const tagObjs = tags.map((line) => {
      const [tag, type] = line.split(":");
      return { tag: tag.trim(), type: (type || "String").trim() };
    });
    addLog("info", `Batch reading tags: ${tagObjs.map(t => `${t.tag} (${t.type})`).join(", ")}`);
    try {
      const result = await batchReadTags(tagObjs);
      setBatchReadResult(result);
      addLog("success", `Batch read complete: ${JSON.stringify(result)}`);
    } catch (err: any) {
      addLog("error", `Batch read failed: ${err.message || err}`);
    } finally {
      setIsBatchReading(false);
    }
  };
  const handleBatchWrite = async () => {
    setIsBatchWriting(true);
    // Parse lines as TagName:Type=Value
    const tagObjs: { tag: string; type: string; value: any }[] = [];
    batchWriteData.split("\n").forEach((line) => {
      const [left, value] = line.split("=");
      if (left && value !== undefined && value !== "") {
        const [tag, type] = left.split(":");
        tagObjs.push({ tag: tag.trim(), type: (type || "String").trim(), value: value.trim() });
      }
    });
    addLog("info", `Batch writing: ${JSON.stringify(tagObjs)}`);
    try {
      const result = await batchWriteTags(tagObjs);
      setBatchWriteResult(result);
      addLog("success", `Batch write complete: ${JSON.stringify(result)}`);
    } catch (err: any) {
      addLog("error", `Batch write failed: ${err.message || err}`);
    } finally {
      setIsBatchWriting(false);
    }
  };

  // Performance benchmark
  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true);
    addLog("info", `Running benchmark on tag: ${benchmarkTestTag}`);
    try {
      const result = await runBenchmark(benchmarkTestTag, benchmarkTestType, benchmarkTestWrites);
      setBenchmarkResults(result);
      addLog("success", `Benchmark complete: ${JSON.stringify(result)}`);
    } catch (err: any) {
      addLog("error", `Benchmark failed: ${err.message || err}`);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // UI rendering
  return (
    <div className="space-y-6">
      {/* Header and Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isMonitoring && (
            <span className="font-semibold text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
              📊 Monitoring {monitoredTags.length} tags
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      {/* Connect Controls */}
      <div className="bg-white bg-opacity-80 rounded-xl shadow p-4 flex items-center gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-purple-400 outline-none"
          value={plcAddress}
          onChange={(e) => setPlcAddress(e.target.value)}
          disabled={isConnected || isConnecting}
        />
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
          onClick={handleConnect}
          disabled={isConnected || isConnecting}
        >
          Connect
        </button>
        <button
          className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
          onClick={handleDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
      </div>
      {/* Tab Bar */}
      <div className="rounded-xl p-1 bg-gradient-to-r from-purple-500 via-pink-400 to-blue-400 flex gap-2 shadow mb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition text-sm ${activeTab === tab ? 'bg-white bg-opacity-90 text-purple-700 shadow' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Individual' && <span role="img" aria-label="individual">📊</span>}
            {tab === 'Batch' && <span role="img" aria-label="batch">⚡</span>}
            {tab === 'Performance' && <span role="img" aria-label="performance">📈</span>}
            {tab === 'Config' && <span role="img" aria-label="config">⚙️</span>}
            {tab === 'About' && <span role="img" aria-label="about">ℹ️</span>}
            <span className="ml-1">{tab === 'About' ? 'About' : `${tab} Operations`}</span>
          </button>
        ))}
      </div>
      {/* Main Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Tag Operations */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white bg-opacity-90 rounded-2xl shadow p-6">
            {activeTab === "Individual" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="individual">📊</span> Individual Tag Operations</h2>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex flex-col sm:flex-row gap-2 items-center mb-2">
                    <input
                      type="text"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      placeholder="Enter tag name"
                      className="flex-1 px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={tagType}
                      onChange={(e) => setTagType(e.target.value)}
                      className="px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Bool">Bool</option>
                      <option value="Sint">Sint</option>
                      <option value="Int">Int</option>
                      <option value="Dint">Dint</option>
                      <option value="Lint">Lint</option>
                      <option value="Usint">Usint</option>
                      <option value="Uint">Uint</option>
                      <option value="Udint">Udint</option>
                      <option value="Ulint">Ulint</option>
                      <option value="Real">Real</option>
                      <option value="Lreal">Lreal</option>
                      <option value="String">String</option>
                      <option value="Udt">Udt</option>
                    </select>
                    <input
                      type="text"
                      value={tagValue}
                      onChange={(e) => setTagValue(e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex flex-row gap-2 justify-end mb-4">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                      onClick={handleReadTag}
                      disabled={!isConnected || isReading}
                    >
                      {isReading ? "Reading..." : "Read"}
                    </button>
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                      onClick={handleWriteTag}
                      disabled={!isConnected || isWriting}
                    >
                      {isWriting ? "Writing..." : "Write"}
                    </button>
                  </div>
                </div>
                <div className="mb-2 text-sm">Last Read Value: <span className="font-mono text-base">{readValue !== null ? String(readValue) : "-"}</span></div>
                
                {/* Tag Monitoring Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span role="img" aria-label="monitor">📊</span> Tag Monitoring
                  </h3>
                  
                  {/* Add Tag to Monitor */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input
                      type="text"
                      value={newMonitorTag}
                      onChange={(e) => setNewMonitorTag(e.target.value)}
                      placeholder="Tag name to monitor"
                      className="flex-1 px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={newMonitorType}
                      onChange={(e) => setNewMonitorType(e.target.value)}
                      className="px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Bool">Bool</option>
                      <option value="Sint">Sint</option>
                      <option value="Int">Int</option>
                      <option value="Dint">Dint</option>
                      <option value="Lint">Lint</option>
                      <option value="Usint">Usint</option>
                      <option value="Uint">Uint</option>
                      <option value="Udint">Udint</option>
                      <option value="Ulint">Ulint</option>
                      <option value="Real">Real</option>
                      <option value="Lreal">Lreal</option>
                      <option value="String">String</option>
                      <option value="Udt">Udt</option>
                    </select>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                      onClick={addTagToMonitor}
                      disabled={!isConnected || !newMonitorTag.trim()}
                    >
                      Add to Monitor
                    </button>
                  </div>

                  {/* Monitoring Controls */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Update Interval:</label>
                      <select
                        value={monitoringInterval}
                        onChange={(e) => {
                          const newInterval = Number(e.target.value);
                          setMonitoringInterval(newInterval);
                          // If monitoring is active, restart with new interval
                          if (isMonitoring) {
                            setTimeout(() => restartMonitoring(), 50);
                          }
                        }}
                        className="px-2 py-1 bg-white text-black rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={20}>20ms (50 Hz)</option>
                        <option value={50}>50ms (20 Hz)</option>
                        <option value={100}>100ms (10 Hz)</option>
                        <option value={200}>200ms (5 Hz)</option>
                        <option value={500}>500ms (2 Hz)</option>
                        <option value={1000}>1000ms (1 Hz)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                        onClick={startMonitoring}
                        disabled={!isConnected || isMonitoring || monitoredTags.length === 0}
                      >
                        {isMonitoring ? "Monitoring..." : "Start Monitoring"}
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                        onClick={stopMonitoring}
                        disabled={!isMonitoring}
                      >
                        Stop Monitoring
                      </button>
                    </div>
                  </div>

                  {/* Monitoring Table */}
                  {monitoredTags.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Monitored Tags ({monitoredTags.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left py-2 px-2">Tag Name</th>
                              <th className="text-left py-2 px-2">Type</th>
                              <th className="text-left py-2 px-2">Value</th>
                              <th className="text-left py-2 px-2">Last Update</th>
                              <th className="text-left py-2 px-2">Status</th>
                              <th className="text-left py-2 px-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monitoredTags.map((tag) => (
                              <tr key={tag.id} className="border-b border-gray-200">
                                <td className="py-2 px-2 font-mono">{tag.name}</td>
                                <td className="py-2 px-2">{tag.type}</td>
                                <td className="py-2 px-2 font-mono">
                                  {tag.error ? (
                                    <span className="text-red-500">Error</span>
                                  ) : (
                                    <span className={tag.value !== null ? "text-green-600" : "text-gray-400"}>
                                      {tag.value !== null ? String(tag.value) : "No data"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-xs text-gray-600">{tag.lastUpdate}</td>
                                <td className="py-2 px-2">
                                  {tag.error ? (
                                    <span className="text-red-500 text-xs">❌ Error</span>
                                  ) : tag.value !== null ? (
                                    <span className="text-green-500 text-xs">✅ OK</span>
                                  ) : (
                                    <span className="text-yellow-500 text-xs">⏳ Pending</span>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  <button
                                    className="text-red-500 hover:text-red-700 text-xs"
                                    onClick={() => removeTagFromMonitor(tag.id)}
                                    disabled={isMonitoring}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "Batch" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="batch">⚡</span> Batch Operations</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tags (one per line, format: TagName:Type, e.g. TestBool:Bool)
                    </label>
                    <textarea
                      value={batchTags}
                      onChange={(e) => setBatchTags(e.target.value)}
                      placeholder={"Example:\nTestTag:Bool\nTestBool:Bool\nTestInt:Dint\nTestReal:Real\nTestString:String"}
                      className="w-full h-32 px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tag Values (one per line, format: TagName:Type=Value, e.g. TestBool:Bool=true)
                    </label>
                    <textarea
                      value={batchWriteData}
                      onChange={(e) => setBatchWriteData(e.target.value)}
                      placeholder={"Example:\nTestTag:Bool=true\nTestBool:Bool=false\nTestInt:Dint=999\nTestReal:Real=88.8\nTestString:String=Hello PLC"}
                      className="w-full h-32 px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-2 justify-end">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                    onClick={handleBatchRead}
                    disabled={!isConnected || isBatchReading}
                  >
                    Batch Read
                  </button>
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                    onClick={handleBatchWrite}
                    disabled={!isConnected || isBatchWriting}
                  >
                    Batch Write
                  </button>
                </div>
                <div className="mt-2 text-sm">Batch Read Result: <span className="font-mono text-base">{batchReadResult ? JSON.stringify(batchReadResult, null, 2) : '-'}</span></div>
                <div className="mb-2 text-sm">Batch Write Result: <span className="font-mono text-base">{batchWriteResult ? JSON.stringify(batchWriteResult) : "-"}</span></div>
              </div>
            )}
            {activeTab === "Performance" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="performance">📈</span> Performance Benchmark</h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="text"
                    value={benchmarkTestTag}
                    onChange={(e) => setBenchmarkTestTag(e.target.value)}
                    placeholder="Benchmark Tag Name"
                    className="flex-1 px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={benchmarkTestType}
                    onChange={(e) => setBenchmarkTestType(e.target.value)}
                    className="px-3 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Bool">Bool</option>
                    <option value="Sint">Sint</option>
                    <option value="Int">Int</option>
                    <option value="Dint">Dint</option>
                    <option value="Lint">Lint</option>
                    <option value="Usint">Usint</option>
                    <option value="Uint">Uint</option>
                    <option value="Udint">Udint</option>
                    <option value="Ulint">Ulint</option>
                    <option value="Real">Real</option>
                    <option value="Lreal">Lreal</option>
                    <option value="String">String</option>
                    <option value="Udt">Udt</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={benchmarkTestWrites}
                      onChange={(e) => setBenchmarkTestWrites(e.target.checked)}
                    />
                    Write Test
                  </label>
                  <button
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
                    onClick={handleRunBenchmark}
                    disabled={!isConnected || isRunningBenchmark}
                  >
                    Run Benchmark
                  </button>
                </div>
                <div className="mb-2 text-sm">Benchmark Results: <span className="font-mono text-base">{benchmarkResults ? JSON.stringify(benchmarkResults) : "-"}</span></div>
                {benchmarkResults && (
                  <div className="text-sm mt-1">Read: {benchmarkResults.readRate?.toFixed(0)} ops/sec, Write: {benchmarkResults.writeRate?.toFixed(0)} ops/sec</div>
                )}
              </div>
            )}
            {activeTab === "HMI Demo" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span role="img" aria-label="hmi">🏭</span> HMI/SCADA Production Demo
                </h2>
                
                {/* Control Panel */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button
                        className={`px-6 py-2 rounded-lg font-semibold transition ${
                          isHmiMonitoring 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        onClick={isHmiMonitoring ? stopHmiMonitoring : startHmiMonitoring}
                        disabled={!isConnected}
                      >
                        {isHmiMonitoring ? '🛑 Stop HMI Demo' : '▶️ Start HMI Demo'}
                      </button>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isHmiMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isHmiMonitoring ? '🟢 Monitoring Active' : '⚫ Monitoring Stopped'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last Update: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Production Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Machine Status */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span role="img" aria-label="machine">⚙️</span> Machine Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          hmiData.machineStatus === 'Running' 
                            ? 'bg-green-100 text-green-800' 
                            : hmiData.machineStatus === 'Stopped'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {hmiData.machineStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Shift:</span>
                        <span className="font-semibold">Shift {hmiData.shift}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Operator:</span>
                        <span className="font-semibold">{hmiData.operator}</span>
                      </div>
                    </div>
                  </div>

                  {/* Production Metrics */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span role="img" aria-label="production">📊</span> Production
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current:</span>
                        <span className="font-bold text-xl text-blue-600">{hmiData.productionCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-semibold">{hmiData.targetCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((hmiData.productionCount / hmiData.targetCount) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        {((hmiData.productionCount / hmiData.targetCount) * 100).toFixed(1)}% Complete
                      </div>
                    </div>
                  </div>

                  {/* OEE Dashboard */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span role="img" aria-label="oee">📈</span> OEE Analysis
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Overall OEE:</span>
                        <span className={`font-bold text-xl ${
                          hmiData.oee >= 85 ? 'text-green-600' : 
                          hmiData.oee >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {hmiData.oee.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Availability:</span>
                        <span className="font-semibold">{hmiData.availability.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Performance:</span>
                        <span className="font-semibold">{hmiData.performance.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Quality:</span>
                        <span className="font-semibold">{hmiData.qualityRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Process Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Temperature */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span role="img" aria-label="temperature">🌡️</span> Temperature
                    </h4>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        hmiData.temperature > 80 ? 'text-red-600' : 
                        hmiData.temperature > 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {hmiData.temperature.toFixed(1)}°C
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            hmiData.temperature > 80 ? 'bg-red-500' : 
                            hmiData.temperature > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((hmiData.temperature / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span role="img" aria-label="pressure">🔧</span> Pressure
                    </h4>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        hmiData.pressure > 8 ? 'text-red-600' : 
                        hmiData.pressure > 6 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {hmiData.pressure.toFixed(1)} bar
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            hmiData.pressure > 8 ? 'bg-red-500' : 
                            hmiData.pressure > 6 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((hmiData.pressure / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Vibration */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span role="img" aria-label="vibration">📳</span> Vibration
                    </h4>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        hmiData.vibration > 5 ? 'text-red-600' : 
                        hmiData.vibration > 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {hmiData.vibration.toFixed(2)} mm/s
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            hmiData.vibration > 5 ? 'bg-red-500' : 
                            hmiData.vibration > 3 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((hmiData.vibration / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Cycle Time */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span role="img" aria-label="cycle">⏱️</span> Cycle Time
                    </h4>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        hmiData.cycleTime > 30 ? 'text-red-600' : 
                        hmiData.cycleTime > 20 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {hmiData.cycleTime.toFixed(1)}s
                      </div>
                      <div className="text-sm text-gray-600">
                        Target: 15.0s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maintenance Info */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span role="img" aria-label="maintenance">🔧</span> Maintenance Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-700">Last Maintenance</h4>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-lg font-semibold text-green-800">{hmiData.lastMaintenance}</div>
                        <div className="text-sm text-green-600">Completed successfully</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-700">Next Maintenance</h4>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-lg font-semibold text-blue-800">{hmiData.nextMaintenance}</div>
                        <div className="text-sm text-blue-600">Scheduled maintenance</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PLC Tag Information */}
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span role="img" aria-label="tags">🏷️</span> Required PLC Tags
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Machine Control</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li><code>HMI_Machine_Status</code> (String)</li>
                        <li><code>HMI_Production_Count</code> (Dint)</li>
                        <li><code>HMI_Target_Count</code> (Dint)</li>
                        <li><code>HMI_Cycle_Time</code> (Real)</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Process Parameters</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li><code>HMI_Temperature</code> (Real)</li>
                        <li><code>HMI_Pressure</code> (Real)</li>
                        <li><code>HMI_Vibration</code> (Real)</li>
                        <li><code>HMI_Quality_Rate</code> (Real)</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <h4 className="font-semibold mb-2">OEE & Personnel</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li><code>HMI_Efficiency</code> (Real)</li>
                        <li><code>HMI_Availability</code> (Real)</li>
                        <li><code>HMI_Performance</code> (Real)</li>
                        <li><code>HMI_Shift</code> (Int)</li>
                        <li><code>HMI_Operator</code> (String)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Create these tags in your PLC with the specified data types. 
                      The demo will read these tags every second to display real-time production data.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Config" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="config">⚙️</span> Configuration</h2>
                <div className="mb-2 text-sm">(Add config options here as needed)</div>
              </div>
            )}
            {activeTab === "About" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="about">ℹ️</span> Technology Overview</h2>
                
                {/* Architecture Overview */}
                <div className="mb-6">
                  <h3 className="font-semibold text-md mb-3 text-purple-700">🏗️ Architecture Overview</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl mb-2">🦀</div>
                        <div className="font-semibold text-sm">Rust Core</div>
                        <div className="text-xs text-gray-600">High-performance EtherNet/IP library</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl mb-2">🐹</div>
                        <div className="font-semibold text-sm">Go Backend</div>
                        <div className="text-xs text-gray-600">REST API & WebSocket server</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-2xl mb-2">⚛️</div>
                        <div className="font-semibold text-sm">Next.js Frontend</div>
                        <div className="text-xs text-gray-600">Modern React UI with TypeScript</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technology Stack */}
                <div className="mb-6">
                  <h3 className="font-semibold text-md mb-3 text-purple-700">🛠️ Technology Stack</h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🦀</span>
                        <div>
                          <div className="font-semibold">Rust EtherNet/IP Library</div>
                          <div className="text-sm text-gray-600">Core communication engine</div>
                        </div>
                      </div>
                      <ul className="text-sm text-gray-700 ml-8 space-y-1">
                        <li>• Memory-safe, high-performance PLC communication</li>
                        <li>• Support for all Allen-Bradley data types</li>
                        <li>• Batch operations and real-time subscriptions</li>
                        <li>• FFI bindings for multiple languages</li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🐹</span>
                        <div>
                          <div className="font-semibold">Go Backend (Gorilla Mux + WebSocket)</div>
                          <div className="text-sm text-gray-600">REST API and real-time communication</div>
                        </div>
                      </div>
                      <ul className="text-sm text-gray-700 ml-8 space-y-1">
                        <li>• High-performance HTTP server with Gorilla Mux</li>
                        <li>• WebSocket support for real-time updates</li>
                        <li>• CGO bindings to Rust library</li>
                        <li>• Concurrent request handling</li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">⚛️</span>
                        <div>
                          <div className="font-semibold">Next.js Frontend (TypeScript + Tailwind)</div>
                          <div className="text-sm text-gray-600">Modern, responsive web interface</div>
                        </div>
                      </div>
                      <ul className="text-sm text-gray-700 ml-8 space-y-1">
                        <li>• TypeScript for type safety and better DX</li>
                        <li>• Tailwind CSS for responsive design</li>
                        <li>• Real-time tag monitoring with configurable intervals</li>
                        <li>• Batch operations and performance benchmarking</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="mb-6">
                  <h3 className="font-semibold text-md mb-3 text-purple-700">⭐ Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-semibold text-sm mb-2">🚀 Performance</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Sub-millisecond PLC communication</li>
                        <li>• High-frequency monitoring (up to 50Hz)</li>
                        <li>• Batch operations for efficiency</li>
                        <li>• Memory-safe Rust core</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-semibold text-sm mb-2">🔧 Developer Experience</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Type-safe APIs across all layers</li>
                        <li>• Hot reloading in development</li>
                        <li>• Comprehensive error handling</li>
                        <li>• Real-time debugging tools</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-semibold text-sm mb-2">🌐 Scalability</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Microservices-ready architecture</li>
                        <li>• Horizontal scaling support</li>
                        <li>• Multiple language bindings</li>
                        <li>• Cloud deployment ready</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-semibold text-sm mb-2">🛡️ Reliability</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Memory safety with Rust</li>
                        <li>• Automatic error recovery</li>
                        <li>• Connection monitoring</li>
                        <li>• Graceful degradation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Why This Architecture */}
                <div className="mb-6">
                  <h3 className="font-semibold text-md mb-3 text-purple-700">🤔 Why This Architecture?</h3>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <span className="font-semibold">Performance:</span> Rust provides near-C performance for PLC communication while maintaining memory safety
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <span className="font-semibold">Scalability:</span> Go's excellent concurrency model handles multiple PLC connections efficiently
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <span className="font-semibold">Developer Experience:</span> TypeScript and modern React provide excellent tooling and maintainability
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <span className="font-semibold">Cross-Platform:</span> Each component can be deployed independently across different environments
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <span className="font-semibold">Future-Proof:</span> Modern technologies with strong community support and active development
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Use Cases */}
                <div className="mb-6">
                  <h3 className="font-semibold text-md mb-3 text-purple-700">🎯 Perfect For</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                      <div className="text-2xl mb-2">🏭</div>
                      <div className="font-semibold text-sm">Industrial IoT</div>
                      <div className="text-xs text-gray-600 mt-1">Real-time monitoring and control systems</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-semibold text-sm">Data Analytics</div>
                      <div className="text-xs text-gray-600 mt-1">High-frequency data collection and analysis</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                      <div className="text-2xl mb-2">🔧</div>
                      <div className="font-semibold text-sm">Prototyping</div>
                      <div className="text-xs text-gray-600 mt-1">Rapid development of PLC applications</div>
                    </div>
                  </div>
                </div>

                {/* Getting Started */}
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
                  <h3 className="font-semibold text-md mb-3 text-purple-700">🚀 Getting Started</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>This demo showcases a production-ready EtherNet/IP communication stack. The architecture demonstrates:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>How to build high-performance PLC communication systems</li>
                      <li>Best practices for microservices architecture</li>
                      <li>Modern web development with real-time capabilities</li>
                      <li>Cross-language integration patterns</li>
                    </ul>
                    <p className="mt-3 font-semibold">Ready to build your own? Check out the source code and documentation!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right: Activity Log */}
        <div className="space-y-6">
          <div className="bg-white bg-opacity-90 rounded-2xl shadow p-6 h-full flex flex-col">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="log">📝</span> Activity Log</h2>
            <div className="flex-1 h-64 overflow-y-auto bg-gray-50 p-3 rounded-lg font-mono text-xs text-gray-700">
              {logs.length === 0 ? (
                <div className="text-gray-400 italic">Activity will be logged here when you interact with the PLC.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`mb-1 ${log.level === 'error' ? 'text-red-500' : log.level === 'success' ? 'text-green-600' : log.level === 'warning' ? 'text-yellow-600' : 'text-gray-700'}`}>{`[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 