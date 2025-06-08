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
const TABS = ["Individual", "Batch", "Performance", "Config"] as const;
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

  // Batch operations
  const [batchTags, setBatchTags] = useState<string>("TestTag\nTestBool\nTestInt\nTestReal\nTestString");
  const [batchReadResult, setBatchReadResult] = useState<any>(null);
  const [batchWriteData, setBatchWriteData] = useState<string>("TestTag=true\nTestBool=false\nTestInt=999\nTestReal=88.8\nTestString=Hello PLC");
  const [batchWriteResult, setBatchWriteResult] = useState<any>(null);
  const [isBatchReading, setIsBatchReading] = useState(false);
  const [isBatchWriting, setIsBatchWriting] = useState(false);

  // Performance
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkTestTag, setBenchmarkTestTag] = useState("");
  const [benchmarkTestType, setBenchmarkTestType] = useState("Dint");
  const [benchmarkTestWrites, setBenchmarkTestWrites] = useState(false);

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
        valueToSend = tagValue === "true" || tagValue === true;
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
      <div className="flex items-center justify-end mb-2">
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
            <span className="ml-1">{tab} Operations</span>
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
              </div>
            )}
            {activeTab === "Batch" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="batch">⚡</span> Batch Operations</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tags (one per line, format: TagName:Type)
                    </label>
                    <textarea
                      value={batchTags}
                      onChange={(e) => setBatchTags(e.target.value)}
                      placeholder="Example:&#10;Tag1:Int&#10;Tag2:Real"
                      className="w-full h-32 px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tag Values (one per line, format: TagName:Type=Value)
                    </label>
                    <textarea
                      value={batchWriteData}
                      onChange={(e) => setBatchWriteData(e.target.value)}
                      placeholder="Example:&#10;Tag1:Int=42&#10;Tag2:Real=3.14"
                      className="w-full h-32 px-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <div className="mb-2 text-sm">Batch Read Result: <span className="font-mono text-base">{batchReadResult ? JSON.stringify(batchReadResult) : "-"}</span></div>
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
              </div>
            )}
            {activeTab === "Config" && (
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span role="img" aria-label="config">⚙️</span> Configuration</h2>
                <div className="mb-2 text-sm">(Add config options here as needed)</div>
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