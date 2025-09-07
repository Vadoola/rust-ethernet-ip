import React, { useState } from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { ConnectionPanelProps, PLCConnection } from '../types';

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  status,
  onConnect,
  onDisconnect,
  isConnecting
}) => {
  const [address, setAddress] = useState('192.168.1.100:44818');
  const [timeout, setTimeout] = useState(5000);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const connection: PLCConnection = {
        address,
        timeout
      };
      await onConnect(connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await onDisconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">PLC Connection</h2>
        <div className="flex items-center space-x-2">
          {status.connected ? (
            <div className="flex items-center text-success-600">
              <Wifi className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-500">
              <WifiOff className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-danger-500 mr-2" />
            <span className="text-danger-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {status.connected ? (
        <div className="space-y-3">
          <div className="p-3 bg-success-50 border border-success-200 rounded-md">
            <p className="text-success-700 text-sm">
              <strong>Address:</strong> {status.address}
            </p>
            <p className="text-success-700 text-sm">
              <strong>Active Subscriptions:</strong> {status.active_subscriptions}
            </p>
            {status.last_connection && (
              <p className="text-success-700 text-sm">
                <strong>Last Connection:</strong> {new Date(status.last_connection).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="w-full bg-danger-500 hover:bg-danger-600 disabled:bg-danger-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <WifiOff className="w-4 h-4 mr-2" />
            )}
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              PLC Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="192.168.1.100:44818"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">
              Timeout (ms)
            </label>
            <input
              type="number"
              id="timeout"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 5000)}
              min="1000"
              max="30000"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !address.trim()}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Wifi className="w-4 h-4 mr-2" />
            )}
            Connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;
