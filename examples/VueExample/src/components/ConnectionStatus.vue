<template>
  <div class="flex items-center space-x-2">
    <div class="flex items-center">
      <div 
        :class="[
          'w-2 h-2 rounded-full mr-2',
          statusClasses
        ]"
      ></div>
      <span class="text-sm font-medium" :class="statusTextClasses">
        {{ statusText }}
      </span>
    </div>
    
    <button
      v-if="!isConnected"
      @click="connect"
      class="btn-primary text-xs py-1 px-3"
      :disabled="isConnecting"
    >
      {{ isConnecting ? 'Connecting...' : 'Connect' }}
    </button>
    
    <button
      v-else
      @click="disconnect"
      class="btn-danger text-xs py-1 px-3"
    >
      Disconnect
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConnectionStore } from '../stores/connection'

const connectionStore = useConnectionStore()

const isConnected = computed(() => connectionStore.isConnected)
const isConnecting = computed(() => connectionStore.isConnecting)

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

const connect = () => {
  connectionStore.connect()
}

const disconnect = () => {
  connectionStore.disconnect()
}
</script>
