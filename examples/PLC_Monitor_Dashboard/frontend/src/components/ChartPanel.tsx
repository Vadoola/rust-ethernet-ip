import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { ChartPanelProps, ChartDataPoint } from '../types';

const ChartPanel: React.FC<ChartPanelProps> = ({
  tagHistory,
  maxDataPoints = 50
}) => {
  if (!tagHistory || tagHistory.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Chart Data</h3>
          <p className="text-sm">
            Select a tag to view its historical data chart.
          </p>
        </div>
      </div>
    );
  }

  // Format data for the chart
  const chartData = tagHistory.data
    .slice(-maxDataPoints) // Keep only the last N data points
    .map((point: ChartDataPoint) => ({
      ...point,
      timestamp: new Date(point.timestamp).toLocaleTimeString(),
      value: typeof point.value === 'number' ? point.value : 0
    }));

  // Calculate statistics
  const values = chartData.map(d => d.value).filter(v => typeof v === 'number');
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

  const formatTooltipValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold text-gray-800">
            {tagHistory.tag_name}
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          {chartData.length} data points
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-600">
            {minValue.toFixed(2)}
          </div>
          <div className="text-xs text-primary-600">Min</div>
        </div>
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <div className="text-2xl font-bold text-success-600">
            {avgValue.toFixed(2)}
          </div>
          <div className="text-xs text-success-600">Average</div>
        </div>
        <div className="text-center p-3 bg-warning-50 rounded-lg">
          <div className="text-2xl font-bold text-warning-600">
            {maxValue.toFixed(2)}
          </div>
          <div className="text-xs text-warning-600">Max</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#666"
              fontSize={12}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tick={{ fontSize: 10 }}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              formatter={(value: any) => [formatTooltipValue(value), 'Value']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Real-time data chart showing the last {maxDataPoints} values
      </div>
    </div>
  );
};

export default ChartPanel;
