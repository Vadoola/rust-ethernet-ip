// TypeScript types for PLC Monitor Dashboard

export interface PLCConnection {
  address: string;
  timeout: number;
}

export interface TagValue {
  tag_name: string;
  value: any;
  data_type: string;
  timestamp: string;
  quality: 'good' | 'bad';
}

export interface TagReadRequest {
  tag_name: string;
}

export interface TagWriteRequest {
  tag_name: string;
  value: any;
  data_type: 'dint' | 'real' | 'bool' | 'string';
}

export interface TagSubscriptionRequest {
  tag_name: string;
  update_rate: number;
  change_threshold: number;
}

export interface PLCStatus {
  connected: boolean;
  address?: string;
  last_connection?: string;
  active_subscriptions: number;
}

export interface Subscription {
  update_rate: number;
  change_threshold: number;
  subscribed_at: string;
}

export interface SubscriptionsResponse {
  subscriptions: Record<string, Subscription>;
}

export interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  tag_name: string;
}

export interface TagHistory {
  tag_name: string;
  data: ChartDataPoint[];
  maxPoints: number;
}

// Component props
export interface TagCardProps {
  tagValue: TagValue;
  onWrite?: (tagName: string, value: any, dataType: string) => void;
  onSubscribe?: (tagName: string) => void;
  onUnsubscribe?: (tagName: string) => void;
  isSubscribed?: boolean;
}

export interface ConnectionPanelProps {
  status: PLCStatus;
  onConnect: (connection: PLCConnection) => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export interface TagListProps {
  tags: TagValue[];
  onTagSelect: (tag: TagValue) => void;
  selectedTag?: string;
}

export interface ChartPanelProps {
  tagHistory: TagHistory;
  maxDataPoints?: number;
}
