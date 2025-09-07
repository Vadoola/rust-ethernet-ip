import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Settings, 
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import './App.css';

import ConnectionPanel from './components/ConnectionPanel';
import TagList from './components/TagList';
import ChartPanel from './components/ChartPanel';

import { plcApi, tagApi, wsService } from './services/api';
import {
  PLCConnection,
  PLCStatus,
  TagValue,
  TagWriteRequest,
  TagHistory,
  ChartDataPoint
} from './types';

const App: React.FC = () => {
  // State management
  const [plcStatus, setPlcStatus] = useState<PLCStatus>({
    connected: false,
    active_subscriptions: 0
  });
  const [tags, setTags] = useState<TagValue[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagHistory, setTagHistory] = useState<TagHistory | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await wsService.connect();
        
        wsService.addEventListener('message', handleWebSocketMessage);
        wsService.addEventListener('error', handleWebSocketError);
        
        addNotification('success', 'WebSocket connected');
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        addNotification('error', 'WebSocket connection failed');
      }
    };

    connectWebSocket();

    return () => {
      wsService.removeEventListener('message', handleWebSocketMessage);
      wsService.removeEventListener('error', handleWebSocketError);
      wsService.disconnect();
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: TagValue) => {
    setTags(prevTags => {
      const existingIndex = prevTags.findIndex(tag => tag.tag_name === data.tag_name);
      if (existingIndex >= 0) {
        const updatedTags = [...prevTags];
        updatedTags[existingIndex] = data;
        return updatedTags;
      } else {
        return [...prevTags, data];
      }
    });

    // Update chart data if this is the selected tag
    if (selectedTag === data.tag_name) {
      setTagHistory(prevHistory => {
        if (!prevHistory) {
          return {
            tag_name: data.tag_name,
            data: [{
              timestamp: data.timestamp,
              value: data.value,
              tag_name: data.tag_name
            }],
            maxPoints: 50
          };
        }

        const newDataPoint: ChartDataPoint = {
          timestamp: data.timestamp,
          value: data.value,
          tag_name: data.tag_name
        };

        const updatedData = [...prevHistory.data, newDataPoint];
        if (updatedData.length > prevHistory.maxPoints) {
          updatedData.shift(); // Remove oldest data point
        }

        return {
          ...prevHistory,
          data: updatedData
        };
      });
    }
  }, [selectedTag]);

  const handleWebSocketError = useCallback((error: any) => {
    console.error('WebSocket error:', error);
    addNotification('error', error.message || 'WebSocket error occurred');
  }, []);

  // Notification system
  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // PLC connection handlers
  const handleConnect = async (connection: PLCConnection) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await plcApi.connect(connection);
      const status = await plcApi.getStatus();
      setPlcStatus(status);
      addNotification('success', `Connected to PLC at ${connection.address}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await plcApi.disconnect();
      setPlcStatus({ connected: false, active_subscriptions: 0 });
      setTags([]);
      setSelectedTag(null);
      setTagHistory(null);
      addNotification('success', 'Disconnected from PLC');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed';
      setError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Tag operations
  const handleTagWrite = async (tagName: string, value: any, dataType: string) => {
    try {
      const request: TagWriteRequest = {
        tag_name: tagName,
        value,
        data_type: dataType as 'dint' | 'real' | 'bool' | 'string'
      };
      
      await tagApi.writeTag(request);
      addNotification('success', `Tag ${tagName} written successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Write failed';
      addNotification('error', `Failed to write ${tagName}: ${errorMessage}`);
      throw error;
    }
  };

  const handleTagSubscribe = async (tagName: string) => {
    try {
      await tagApi.subscribeToTag({
        tag_name: tagName,
        update_rate: 1000,
        change_threshold: 0.1
      });
      addNotification('success', `Subscribed to ${tagName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscribe failed';
      addNotification('error', `Failed to subscribe to ${tagName}: ${errorMessage}`);
    }
  };

  const handleTagUnsubscribe = async (tagName: string) => {
    try {
      await tagApi.unsubscribeFromTag(tagName);
      addNotification('success', `Unsubscribed from ${tagName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unsubscribe failed';
      addNotification('error', `Failed to unsubscribe from ${tagName}: ${errorMessage}`);
    }
  };

  const handleTagSelect = (tag: TagValue) => {
    setSelectedTag(tag.tag_name);
    
    // Initialize chart data for selected tag
    setTagHistory({
      tag_name: tag.tag_name,
      data: [{
        timestamp: tag.timestamp,
        value: tag.value,
        tag_name: tag.tag_name
      }],
      maxPoints: 50
    });
  };

  // Auto-refresh PLC status
  useEffect(() => {
    const interval = setInterval(async () => {
      if (plcStatus.connected) {
        try {
          const status = await plcApi.getStatus();
          setPlcStatus(status);
        } catch (error) {
          console.error('Failed to refresh PLC status:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [plcStatus.connected]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-primary-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                PLC Monitor Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {plcStatus.connected ? (
                  <div className="flex items-center text-success-600">
                    <Wifi className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">PLC Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <WifiOff className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">PLC Disconnected</span>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                {plcStatus.active_subscriptions} subscriptions
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm fade-in ${
                notification.type === 'success' 
                  ? 'bg-success-50 border border-success-200 text-success-800'
                  : notification.type === 'error'
                  ? 'bg-danger-50 border border-danger-200 text-danger-800'
                  : 'bg-primary-50 border border-primary-200 text-primary-800'
              }`}
            >
              <div className="flex items-center">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Connection Panel */}
          <div className="lg:col-span-1">
            <ConnectionPanel
              status={plcStatus}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnecting={isConnecting}
            />
          </div>

          {/* Right Column - Tags and Chart */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tag List */}
            <TagList
              tags={tags}
              onTagSelect={handleTagSelect}
              selectedTag={selectedTag}
            />

            {/* Chart Panel */}
            {selectedTag && tagHistory && (
              <ChartPanel
                tagHistory={tagHistory}
                maxDataPoints={50}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              PLC Monitor Dashboard - Built with Rust, Python FastAPI, and React TypeScript
            </p>
            <p className="mt-1">
              Powered by rust-ethernet-ip library
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
