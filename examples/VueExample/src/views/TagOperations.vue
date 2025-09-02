<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tag Operations</h1>
      <p class="mt-2 text-sm text-gray-700">
        Read and write individual PLC tags with real-time updates
      </p>
    </div>

    <!-- Tag Operations Form -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Tag Operation</h3>
      
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Tag Name Input -->
        <div>
          <label for="tagName" class="block text-sm font-medium text-gray-700 mb-2">
            Tag Name
          </label>
          <input
            id="tagName"
            v-model="tagName"
            type="text"
            placeholder="ProductionCount"
            class="input-field"
          />
        </div>

        <!-- Data Type Selection -->
        <div>
          <label for="dataType" class="block text-sm font-medium text-gray-700 mb-2">
            Data Type
          </label>
          <select
            id="dataType"
            v-model="dataType"
            class="input-field"
          >
            <option value="auto">Auto-detect</option>
            <option value="bool">BOOL</option>
            <option value="sint">SINT</option>
            <option value="int">INT</option>
            <option value="dint">DINT</option>
            <option value="lint">LINT</option>
            <option value="usint">USINT</option>
            <option value="uint">UINT</option>
            <option value="udint">UDINT</option>
            <option value="ulint">ULINT</option>
            <option value="real">REAL</option>
            <option value="lreal">LREAL</option>
            <option value="string">STRING</option>
          </select>
        </div>
      </div>

      <!-- Value Input (for write operations) -->
      <div v-if="operation === 'write'" class="mt-4">
        <label for="tagValue" class="block text-sm font-medium text-gray-700 mb-2">
          Value
        </label>
        <input
          id="tagValue"
          v-model="tagValue"
          type="text"
          placeholder="Enter value..."
          class="input-field"
        />
      </div>

      <!-- Operation Buttons -->
      <div class="flex space-x-3 mt-6">
        <button
          @click="readTag"
          class="btn-primary"
          :disabled="!tagName || !connectionStore.isConnected"
        >
          Read Tag
        </button>
        <button
          @click="writeTag"
          class="btn-success"
          :disabled="!tagName || !tagValue || !connectionStore.isConnected"
        >
          Write Tag
        </button>
        <button
          @click="discoverTag"
          class="btn-secondary"
          :disabled="!tagName || !connectionStore.isConnected"
        >
          Discover Tag
        </button>
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="lastResult" class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Operation Result</h3>
      
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="font-medium">Tag:</span>
          <span>{{ lastResult.tagName }}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium">Operation:</span>
          <span class="capitalize">{{ lastResult.operation }}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium">Success:</span>
          <span :class="lastResult.success ? 'text-success-600' : 'text-danger-600'">
            {{ lastResult.success ? 'Yes' : 'No' }}
          </span>
        </div>
        <div v-if="lastResult.value !== undefined" class="flex justify-between">
          <span class="font-medium">Value:</span>
          <span class="font-mono">{{ lastResult.value }}</span>
        </div>
        <div v-if="lastResult.error" class="flex justify-between">
          <span class="font-medium">Error:</span>
          <span class="text-danger-600">{{ lastResult.error }}</span>
        </div>
        <div v-if="lastResult.executionTime" class="flex justify-between">
          <span class="font-medium">Execution Time:</span>
          <span>{{ lastResult.executionTime }}ms</span>
        </div>
      </div>
    </div>

    <!-- Tag History -->
    <div class="card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Operations</h3>
      
      <div class="space-y-2">
        <div
          v-for="op in operationHistory"
          :key="op.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                op.success ? 'bg-success-500' : 'bg-danger-500'
              ]"
            ></div>
            <span class="text-sm font-medium">{{ op.tagName }}</span>
            <span class="text-xs text-gray-500 capitalize">({{ op.operation }})</span>
          </div>
          <div class="flex items-center space-x-4">
            <span v-if="op.value !== undefined" class="text-sm font-mono">
              {{ op.value }}
            </span>
            <span class="text-xs text-gray-500">{{ formatTime(op.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConnectionStore } from '../stores/connection'
import { apiService } from '../services/api'
import type { TagOperation, BatchResult } from '../services/api'

const connectionStore = useConnectionStore()

// Form data
const tagName = ref('')
const dataType = ref('auto')
const tagValue = ref('')
const operation = ref<'read' | 'write'>('read')

// Results
const lastResult = ref<BatchResult | null>(null)
const operationHistory = ref<Array<BatchResult & { id: number; timestamp: Date }>>([])

const readTag = async () => {
  if (!tagName.value) return

  try {
    const result = await apiService.readTag(tagName.value)
    
    if (result.success && result.data) {
      const operationResult: BatchResult = {
        tagName: tagName.value,
        operation: 'read',
        success: true,
        value: result.data.value,
        executionTime: 0
      }
      
      lastResult.value = operationResult
      addToHistory(operationResult)
    } else {
      const operationResult: BatchResult = {
        tagName: tagName.value,
        operation: 'read',
        success: false,
        error: result.error || 'Read failed',
        executionTime: 0
      }
      
      lastResult.value = operationResult
      addToHistory(operationResult)
    }
  } catch (error) {
    console.error('Read tag error:', error)
  }
}

const writeTag = async () => {
  if (!tagName.value || !tagValue.value) return

  try {
    const result = await apiService.writeTag(tagName.value, tagValue.value, dataType.value)
    
    const operationResult: BatchResult = {
      tagName: tagName.value,
      operation: 'write',
      success: result.success,
      error: result.error,
      executionTime: 0
    }
    
    lastResult.value = operationResult
    addToHistory(operationResult)
    
    if (result.success) {
      tagValue.value = ''
    }
  } catch (error) {
    console.error('Write tag error:', error)
  }
}

const discoverTag = async () => {
  if (!tagName.value) return

  try {
    const result = await apiService.getTagInfo(tagName.value)
    
    if (result.success && result.data) {
      const operationResult: BatchResult = {
        tagName: tagName.value,
        operation: 'read',
        success: true,
        value: JSON.stringify(result.data),
        executionTime: 0
      }
      
      lastResult.value = operationResult
      addToHistory(operationResult)
    } else {
      const operationResult: BatchResult = {
        tagName: tagName.value,
        operation: 'read',
        success: false,
        error: result.error || 'Discovery failed',
        executionTime: 0
      }
      
      lastResult.value = operationResult
      addToHistory(operationResult)
    }
  } catch (error) {
    console.error('Discover tag error:', error)
  }
}

const addToHistory = (operation: BatchResult) => {
  const historyItem = {
    ...operation,
    id: Date.now(),
    timestamp: new Date()
  }
  
  operationHistory.value.unshift(historyItem)
  
  // Keep only last 20 operations
  if (operationHistory.value.length > 20) {
    operationHistory.value = operationHistory.value.slice(0, 20)
  }
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  return timestamp.toLocaleTimeString()
}
</script>
