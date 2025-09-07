import React, { useState } from 'react';
import { 
  Activity, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { TagCardProps, TagValue } from '../types';

const TagCard: React.FC<TagCardProps> = ({
  tagValue,
  onWrite,
  onSubscribe,
  onUnsubscribe,
  isSubscribed = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const handleEdit = () => {
    setEditValue(tagValue.value?.toString() || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (onWrite && editValue !== '') {
      setIsWriting(true);
      try {
        await onWrite(tagValue.tag_name, editValue, tagValue.data_type);
        setIsEditing(false);
      } catch (error) {
        console.error('Error writing tag:', error);
      } finally {
        setIsWriting(false);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleSubscribe = () => {
    if (isSubscribed && onUnsubscribe) {
      onUnsubscribe(tagValue.tag_name);
    } else if (!isSubscribed && onSubscribe) {
      onSubscribe(tagValue.tag_name);
    }
  };

  const getValueDisplay = () => {
    if (tagValue.quality === 'bad') {
      return <span className="text-danger-500">Error</span>;
    }
    
    if (tagValue.value === null || tagValue.value === undefined) {
      return <span className="text-gray-500">No Data</span>;
    }

    switch (tagValue.data_type) {
      case 'bool':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            tagValue.value ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {tagValue.value ? 'TRUE' : 'FALSE'}
          </span>
        );
      case 'float':
      case 'real':
      case 'lreal':
        return <span className="font-mono">{parseFloat(tagValue.value).toFixed(2)}</span>;
      case 'int':
      case 'dint':
      case 'lint':
        return <span className="font-mono">{parseInt(tagValue.value)}</span>;
      case 'string':
        return <span className="break-all">{tagValue.value}</span>;
      default:
        return <span className="font-mono">{tagValue.value}</span>;
    }
  };

  const getQualityColor = () => {
    switch (tagValue.quality) {
      case 'good':
        return 'border-success-200 bg-success-50';
      case 'bad':
        return 'border-danger-200 bg-danger-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getQualityIcon = () => {
    switch (tagValue.quality) {
      case 'good':
        return <Check className="w-4 h-4 text-success-500" />;
      case 'bad':
        return <X className="w-4 h-4 text-danger-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning-500" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getQualityColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-800 truncate">{tagValue.tag_name}</h3>
        </div>
        <div className="flex items-center space-x-1">
          {getQualityIcon()}
          <button
            onClick={handleSubscribe}
            className={`p-1 rounded transition-colors duration-200 ${
              isSubscribed 
                ? 'text-primary-600 hover:text-primary-700' 
                : 'text-gray-400 hover:text-primary-600'
            }`}
            title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          >
            {isSubscribed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-1">Value</div>
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={isWriting}
                className="px-2 py-1 bg-success-500 hover:bg-success-600 disabled:bg-success-300 text-white text-xs rounded transition-colors duration-200"
              >
                {isWriting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">{getValueDisplay()}</div>
            {onWrite && (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                title="Edit value"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="capitalize">{tagValue.data_type}</span>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(tagValue.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TagCard;
