<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-2 text-sm text-gray-700">
          Monitor your EtherNet/IP PLC connection and view real-time status
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <ConnectionPanel />
      </div>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        title="Connection Status"
        :value="connectionStatusText"
        :status="connectionStore.connectionStatus"
        icon="wifi"
      />
      <StatusCard
        title="Uptime"
        :value="uptimeText"
        status="connected"
        icon="clock"
      />
      <StatusCard
        title="Active Tags"
        :value="activeTagsCount.toString()"
        status="connected"
        icon="tag"
      />
      <StatusCard
        title="Performance"
        :value="performanceText"
        status="connected"
        icon="trending-up"
      />
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Read Tag"
          description="Read a single tag value"
          icon="eye"
          @click="$router.push('/tags')"
        />
        <QuickActionCard
          title="Write Tag"
          description="Write value to a tag"
          icon="edit"
          @click="$router.push('/tags')"
        />
        <QuickActionCard
          title="Batch Operations"
          description="Execute multiple operations"
          icon="layers"
          @click="$router.push('/batch')"
        />
        <QuickActionCard
          title="Performance Test"
          description="Run benchmark tests"
          icon="zap"
          @click="$router.push('/performance')"
        />
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div class="space-y-3">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                activity.type === 'success' ? 'bg-success-500' : 'bg-danger-500'
              ]"
            ></div>
            <span class="text-sm text-gray-700">{{ activity.message }}</span>
          </div>
          <span class="text-xs text-gray-500">{{ formatTime(activity.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Backend Detection (Development Only) -->
    <BackendDetector v-if="isDevelopment" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConnectionStore } from '../stores/connection'
import { apiService } from '../services/api'
import ConnectionPanel from '../components/ConnectionPanel.vue'
import StatusCard from '../components/StatusCard.vue'
import QuickActionCard from '../components/QuickActionCard.vue'
import BackendDetector from '../components/BackendDetector.vue'

const connectionStore = useConnectionStore()

// Development mode detection
const isDevelopment = computed(() => import.meta.env.DEV)

// Mock data for demonstration
const activeTagsCount = ref(12)
const performanceText = ref('2.5k ops/sec')

const connectionStatusText = computed(() => {
  switch (connectionStore.connectionStatus) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting...'
    case 'disconnected':
      return 'Disconnected'
    default:
      return 'Unknown'
  }
})

const uptimeText = computed(() => {
  if (!connectionStore.uptime) return 'N/A'
  const seconds = Math.floor(connectionStore.uptime / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
})

const recentActivities = ref([
  {
    id: 1,
    type: 'success',
    message: 'Successfully connected to PLC at 192.168.1.100:44818',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 2,
    type: 'success',
    message: 'Read tag "ProductionCount" = 1,247',
    timestamp: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: 3,
    type: 'success',
    message: 'Batch operation completed: 15 tags read in 45ms',
    timestamp: new Date(Date.now() - 1 * 60 * 1000)
  }
])

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  return timestamp.toLocaleTimeString()
}

onMounted(async () => {
  // Initialize dashboard data by checking connection status
  try {
    const status = await apiService.getConnectionStatus()
    if (status.success && status.data) {
      // Update the store with the current connection status
      if (status.data.isConnected) {
        connectionStore.isConnected = true
        connectionStore.connectionTime = new Date(status.data.timestamp)
      }
    }
  } catch (error) {
    console.error('Failed to get connection status:', error)
  }
})
</script>
