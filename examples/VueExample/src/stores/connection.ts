import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export interface ConnectionConfig {
  ipAddress: string
  port: number
  timeout: number
}

export const useConnectionStore = defineStore('connection', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionConfig = ref<ConnectionConfig>({
    ipAddress: '192.168.1.100',
    port: 44818,
    timeout: 5000
  })
  const lastError = ref<string | null>(null)
  const connectionTime = ref<Date | null>(null)

  // Getters
  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    return 'disconnected'
  })

  const connectionString = computed(() => {
    return `${connectionConfig.value.ipAddress}:${connectionConfig.value.port}`
  })

  const uptime = computed(() => {
    if (!connectionTime.value) return 0
    return Date.now() - connectionTime.value.getTime()
  })

  // Actions
  const connect = async () => {
    if (isConnected.value || isConnecting.value) return

    isConnecting.value = true
    lastError.value = null

    try {
      const response = await apiService.connect(connectionString.value)
      
      if (response.success) {
        isConnected.value = true
        connectionTime.value = new Date()
        lastError.value = null
      } else {
        lastError.value = response.error || 'Connection failed'
      }
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Unknown error occurred'
    } finally {
      isConnecting.value = false
    }
  }

  const disconnect = async () => {
    if (!isConnected.value) return

    try {
      await apiService.disconnect()
      isConnected.value = false
      connectionTime.value = null
      lastError.value = null
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Disconnect failed'
    }
  }

  const updateConfig = (config: Partial<ConnectionConfig>) => {
    connectionConfig.value = { ...connectionConfig.value, ...config }
  }

  const reset = () => {
    isConnected.value = false
    isConnecting.value = false
    lastError.value = null
    connectionTime.value = null
  }

  return {
    // State
    isConnected,
    isConnecting,
    connectionConfig,
    lastError,
    connectionTime,
    
    // Getters
    connectionStatus,
    connectionString,
    uptime,
    
    // Actions
    connect,
    disconnect,
    updateConfig,
    reset
  }
})
