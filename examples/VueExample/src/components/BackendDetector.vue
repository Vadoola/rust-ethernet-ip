<template>
  <div class="card">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Backend Connection Test</h3>
    
    <div class="space-y-4">
      <!-- Port Detection -->
      <div>
        <h4 class="font-medium text-gray-700 mb-2">Detected Backend Ports:</h4>
        <div class="space-y-2">
          <div v-for="port in detectedPorts" :key="port" class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <span class="text-sm">Port {{ port }} - Active</span>
          </div>
          <div v-if="detectedPorts.length === 0" class="text-sm text-gray-500">
            No backend detected on common ports
          </div>
        </div>
      </div>

      <!-- Manual Port Test -->
      <div>
        <h4 class="font-medium text-gray-700 mb-2">Test Specific Port:</h4>
        <div class="flex space-x-2">
          <input
            v-model="testPort"
            type="number"
            placeholder="Port number"
            class="input-field flex-1"
            min="1"
            max="65535"
          />
          <button
            @click="testPortConnection"
            class="btn-primary"
            :disabled="!testPort || isTesting"
          >
            {{ isTesting ? 'Testing...' : 'Test' }}
          </button>
        </div>
        <div v-if="testResult" class="mt-2 text-sm" :class="testResult.success ? 'text-green-600' : 'text-red-600'">
          {{ testResult.message }}
        </div>
      </div>

      <!-- Current API Configuration -->
      <div>
        <h4 class="font-medium text-gray-700 mb-2">Current API Configuration:</h4>
        <div class="text-sm text-gray-600">
          <div>Base URL: {{ currentBaseUrl }}</div>
          <div>Proxy Status: {{ proxyStatus }}</div>
        </div>
      </div>

             <!-- Test Port 5000 Endpoints -->
       <div>
         <h4 class="font-medium text-gray-700 mb-2">Test Port 5000 Endpoints:</h4>
         <button
           @click="testPort5000Endpoints"
           class="btn-secondary w-full mb-2"
           :disabled="isTestingPort5000"
         >
           {{ isTestingPort5000 ? 'Testing...' : 'Test Port 5000 Endpoints' }}
         </button>
         <div v-if="port5000Results.length > 0" class="space-y-1">
           <div v-for="result in port5000Results" :key="result.endpoint" class="text-sm">
             <span class="font-mono">{{ result.endpoint }}</span>: 
             <span :class="result.working ? 'text-green-600' : 'text-red-600'">
               {{ result.status === -1 ? 'Connection Failed' : `Status ${result.status}` }}
             </span>
           </div>
         </div>
       </div>

       <!-- Refresh Button -->
       <button
         @click="refreshDetection"
         class="btn-secondary w-full"
         :disabled="isDetecting"
       >
         {{ isDetecting ? 'Detecting...' : 'Refresh Detection' }}
       </button>
     </div>
   </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { backendConfig } from '../config/backend'
import { apiService } from '../services/api'

const detectedPorts = ref<number[]>([])
const testPort = ref('')
const testResult = ref<{ success: boolean; message: string } | null>(null)
const isDetecting = ref(false)
const isTesting = ref(false)
const isTestingPort5000 = ref(false)
const currentBaseUrl = ref('')
const proxyStatus = ref('Unknown')
const port5000Results = ref<Array<{ endpoint: string; status: number; working: boolean }>>([])

const detectBackendPorts = async () => {
  isDetecting.value = true
  detectedPorts.value = []
  
  try {
    for (const port of backendConfig.possiblePorts) {
      try {
        // Try multiple common endpoints
        const endpoints = ['/health', '/api/health', '/', '/api', '/swagger'];
        
        for (const endpoint of endpoints) {
          try {
            // First try without CORS mode to get actual status
            const response = await fetch(`http://localhost:${port}${endpoint}`, {
              method: 'GET',
              cache: 'no-cache'
            });
            
            // Check if the response is actually successful (2xx status)
            if (response.ok) {
              detectedPorts.value.push(port)
              console.log(`Port ${port} endpoint ${endpoint} is working (Status: ${response.status})`);
              break; // Found a working endpoint for this port
            } else {
              console.log(`Port ${port} endpoint ${endpoint} returned status ${response.status}`);
            }
          } catch (endpointError) {
            // If CORS fails, try with no-cors mode as fallback
            try {
              const response = await fetch(`http://localhost:${port}${endpoint}`, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
              });
              
              // With no-cors, we can't check status, but if we get here the port is accessible
              detectedPorts.value.push(port)
              console.log(`Port ${port} endpoint ${endpoint} is accessible (no-cors mode)`);
              break; // Found a working endpoint for this port
            } catch (noCorsError) {
              // Endpoint not accessible, try next one
              continue
            }
          }
        }
      } catch (error) {
        // Port not accessible
        continue
      }
    }
  } catch (error) {
    console.error('Port detection failed:', error)
  } finally {
    isDetecting.value = false
  }
}

const testPortConnection = async () => {
  if (!testPort.value) return
  
  isTesting.value = true
  testResult.value = null
  
  try {
    const port = parseInt(testPort.value)
    // Try multiple common endpoints
    const endpoints = ['/health', '/api/health', '/', '/api', '/swagger'];
    let accessible = false;
    let workingEndpoint = '';
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:${port}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        accessible = true;
        workingEndpoint = endpoint;
        break;
      } catch (endpointError) {
        continue;
      }
    }
    
    if (accessible) {
      testResult.value = {
        success: true,
        message: `Port ${port} is accessible at ${workingEndpoint}!`
      }
      
      // Add to detected ports if not already there
      if (!detectedPorts.value.includes(port)) {
        detectedPorts.value.push(port)
      }
    } else {
      testResult.value = {
        success: false,
        message: `Port ${testPort.value} is not accessible at any common endpoint`
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Port ${testPort.value} is not accessible: ${error}`
    }
  } finally {
    isTesting.value = false
  }
}

const refreshDetection = () => {
  detectBackendPorts()
}

const testPort5000Endpoints = async () => {
  isTestingPort5000.value = true
  port5000Results.value = []
  
  try {
    const results = await backendConfig.testPortEndpoints(5000)
    port5000Results.value = results
  } catch (error) {
    console.error('Failed to test port 5000 endpoints:', error)
  } finally {
    isTestingPort5000.value = false
  }
}

const updateApiInfo = () => {
  currentBaseUrl.value = apiService['api']?.defaults?.baseURL || 'Not set'
  proxyStatus.value = currentBaseUrl.value.startsWith('http') ? 'Direct Connection' : 'Proxy'
}

onMounted(() => {
  detectBackendPorts()
  updateApiInfo()
  
  // Update info periodically
  setInterval(updateApiInfo, 2000)
})
</script>
