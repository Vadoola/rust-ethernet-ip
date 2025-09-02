<template>
  <div class="card max-w-md">
    <h3 class="text-lg font-medium text-gray-900 mb-4">PLC Connection</h3>
    
    <div class="space-y-4">
      <!-- Connection Input -->
      <div>
        <label for="connectionString" class="block text-sm font-medium text-gray-700 mb-2">
          PLC Address
        </label>
        <input
          id="connectionString"
          v-model="connectionString"
          type="text"
          placeholder="192.168.1.100:44818"
          class="input-field"
          :disabled="isConnected || isConnecting"
        />
      </div>

      <!-- Connection Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-2 h-2 rounded-full',
              statusClasses
            ]"
          ></div>
          <span class="text-sm font-medium" :class="statusTextClasses">
            {{ statusText }}
          </span>
        </div>
        
        <button
          v-if="!isConnected"
          @click="handleConnect"
          class="btn-primary text-sm"
          :disabled="isConnecting || !connectionString"
        >
          {{ isConnecting ? 'Connecting...' : 'Connect' }}
        </button>
        
        <button
          v-else
          @click="handleDisconnect"
          class="btn-danger text-sm"
        >
          Disconnect
        </button>
      </div>

      <!-- Error Display -->
      <div
        v-if="lastError"
        class="p-3 bg-danger-50 border border-danger-200 rounded-lg"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm text-danger-700">{{ lastError }}</span>
        </div>
      </div>

      <!-- Connection Info -->
      <div v-if="isConnected" class="pt-4 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          <div class="flex justify-between">
            <span>Connected to:</span>
            <span class="font-medium">{{ connectionString }}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span>Uptime:</span>
            <span class="font-medium">{{ uptimeText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConnectionStore } from '../stores/connection'

const connectionStore = useConnectionStore()

const connectionString = ref('192.168.1.100:44818')

const isConnected = computed(() => connectionStore.isConnected)
const isConnecting = computed(() => connectionStore.isConnecting)
const lastError = computed(() => connectionStore.lastError)

const statusText = computed(() => {
  if (isConnecting.value) return 'Connecting...'
  if (isConnected.value) return 'Connected'
  return 'Disconnected'
})

const statusClasses = computed(() => {
  if (isConnecting.value) return 'bg-warning-500 animate-pulse'
  if (isConnected.value) return 'bg-success-500'
  return 'bg-danger-500'
})

const statusTextClasses = computed(() => {
  if (isConnecting.value) return 'text-warning-700'
  if (isConnected.value) return 'text-success-700'
  return 'text-danger-700'
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

const handleConnect = async () => {
  if (!connectionString.value) return
  
  connectionStore.updateConfig({
    ipAddress: connectionString.value.split(':')[0],
    port: parseInt(connectionString.value.split(':')[1]) || 44818
  })
  
  await connectionStore.connect()
}

const handleDisconnect = async () => {
  await connectionStore.disconnect()
}

onMounted(() => {
  // Initialize with current connection config
  connectionString.value = connectionStore.connectionString
})
</script>
