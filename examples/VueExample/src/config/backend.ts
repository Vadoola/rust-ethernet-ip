// Backend configuration
export const backendConfig = {
  // Common ASP.NET Core development ports
  possiblePorts: [5000, 5001, 7000, 7001, 8000, 8001],
  
  // Default port (most common for ASP.NET Core)
  defaultPort: 5000,
  
  // Get the backend URL based on environment
  async getBackendUrl(): Promise<string> {
    if (import.meta.env.DEV) {
      // In development, try to use the proxy first, fallback to direct connection
      const port = await this.detectBackendPort();
      if (port) {
        return `http://localhost:${port}/api`;
      }
    }
    
    // Use proxy in production or fallback
    return '/api';
  },
  
  // Try to detect which port the backend is running on
  async detectBackendPort(): Promise<number | null> {
    for (const port of this.possiblePorts) {
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
              console.log(`Backend detected on port ${port} at endpoint ${endpoint} (Status: ${response.status})`);
              return port;
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
              console.log(`Backend detected on port ${port} at endpoint ${endpoint} (no-cors mode)`);
              return port;
            } catch (noCorsError) {
              // Endpoint not accessible, try next one
              continue;
            }
          }
        }
      } catch (error) {
        // Port not accessible, try next one
        continue;
      }
    }
    
    console.warn('No backend detected on common ports, using proxy fallback');
    return null;
  },

  // Test a specific port to see what endpoints are available
  async testPortEndpoints(port: number): Promise<{ endpoint: string; status: number; working: boolean }[]> {
    const endpoints = ['/health', '/api/health', '/', '/api', '/swagger', '/api/status', '/api/connect'];
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:${port}${endpoint}`, {
          method: 'GET',
          cache: 'no-cache'
        });
        
        results.push({
          endpoint,
          status: response.status,
          working: response.ok
        });
        
        console.log(`Port ${port} ${endpoint}: ${response.status} ${response.ok ? '✓' : '✗'}`);
      } catch (error) {
        results.push({
          endpoint,
          status: -1,
          working: false
        });
        
        console.log(`Port ${port} ${endpoint}: Connection failed`);
      }
    }
    
    return results;
  }
};

export default backendConfig;
