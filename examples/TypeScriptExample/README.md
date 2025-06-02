# 🦀 Rust EtherNet/IP - TypeScript Example

A modern **React + TypeScript** dashboard demonstrating the complete capabilities of the Rust EtherNet/IP library through a web-based interface.

## 🏗️ Architecture

This example showcases the **recommended approach** for integrating the Rust EtherNet/IP library with TypeScript applications:

```
┌─────────────────────┐    HTTP/REST    ┌─────────────────────┐    FFI    ┌─────────────────────┐
│   React Frontend    │ ◄──────────────► │  ASP.NET Core API   │ ◄────────► │   Rust Library      │
│   (TypeScript)      │                  │   (C# Wrapper)      │            │  (rust-ethernet-ip) │
└─────────────────────┘                  └─────────────────────┘            └─────────────────────┘
```

### ✅ **Why This Architecture?**

1. **🔒 Type Safety**: Full TypeScript support with comprehensive type definitions
2. **🌐 Web Standards**: Uses standard HTTP/REST communication
3. **🔄 Reusable Backend**: Leverages existing ASP.NET Core API
4. **📱 Cross-Platform**: Runs in any modern browser
5. **🚀 Scalable**: Easy to add authentication, real-time updates, etc.

## 🎯 Features Demonstrated

### **Complete Data Type Support**
- ✅ All 13 Allen-Bradley data types (BOOL, SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT, REAL, LREAL, STRING, UDT)
- ✅ Type-safe TypeScript interfaces
- ✅ Automatic type detection and validation

### **Advanced Tag Addressing**
- ✅ Program-scoped tags: `Program:MainProgram.Motor.Status`
- ✅ Array element access: `DataArray[5]`
- ✅ Bit-level operations: `StatusWord.15`
- ✅ UDT member access: `MotorData.Speed`
- ✅ String operations: `ProductName.LEN`

### **Modern UI/UX**
- ✅ Responsive design with glassmorphism effects
- ✅ Real-time tag monitoring with live updates
- ✅ Performance benchmarking with visual metrics
- ✅ Comprehensive activity logging
- ✅ Interactive tag discovery with examples

### **Professional Features**
- ✅ Connection management with status monitoring
- ✅ Error handling with detailed feedback
- ✅ Parallel tag operations for performance
- ✅ Real-time monitoring dashboard
- ✅ Export-ready component architecture

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- .NET 8.0 SDK
- Rust toolchain
- Running ASP.NET Core backend

### **1. Start the Backend API**
```bash
# From the project root
cd examples/AspNetExample
dotnet run
```
The API will be available at `http://localhost:5000`

### **2. Install Frontend Dependencies**
```bash
cd examples/TypeScriptExample/frontend
npm install
```

### **3. Start the Development Server**
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173`

### **4. Connect to Your PLC**
1. Enter your PLC address (e.g., `192.168.0.1:44818`)
2. Click **Connect**
3. Start exploring tags and monitoring data!

## 📁 Project Structure

```
examples/TypeScriptExample/
├── frontend/                    # React + TypeScript application
│   ├── src/
│   │   ├── api/
│   │   │   └── plcApi.ts       # Type-safe API client
│   │   ├── App.tsx             # Main dashboard component
│   │   ├── App.css             # Modern styling
│   │   └── main.tsx            # Application entry point
│   ├── package.json            # Dependencies and scripts
│   └── tsconfig.json           # TypeScript configuration
└── README.md                   # This file
```

## 🔧 API Client Features

The `plcApi.ts` module provides a comprehensive TypeScript interface:

```typescript
// Type-safe data type definitions
export type PlcDataType = 
  | 'BOOL' | 'SINT' | 'INT' | 'DINT' | 'LINT'
  | 'USINT' | 'UINT' | 'UDINT' | 'ULINT'
  | 'REAL' | 'LREAL' | 'STRING' | 'UDT';

// Comprehensive API methods
const plcApi = new PlcApiClient();

// Connection management
await plcApi.connect('192.168.0.1:44818');
await plcApi.disconnect();

// Tag operations with auto-type detection
const tag = await plcApi.discoverTag('MotorSpeed');
const result = await plcApi.readTag('MotorSpeed');
await plcApi.writeTag('MotorSpeed', 'REAL', 1750.0);

// Parallel operations for performance
const tags = await plcApi.readMultipleTags(['Tag1', 'Tag2', 'Tag3']);
await plcApi.writeMultipleTags([
  { name: 'Motor1', type: 'BOOL', value: true },
  { name: 'Speed1', type: 'REAL', value: 1750.0 }
]);

// Performance monitoring
const benchmark = await plcApi.runBenchmark();
const status = await plcApi.getStatus();
```

## 🎨 UI Components

### **Connection Panel**
- PLC address input with validation
- Connect/disconnect controls
- Real-time connection status
- Session information display

### **Tag Discovery**
- Interactive tag name input
- One-click advanced tag examples
- Automatic type detection
- Comprehensive error feedback

### **Tag Operations**
- Read/write operations with type validation
- Data type selector with descriptions
- Value input with format validation
- Add to monitoring functionality

### **Performance Monitoring**
- Real-time benchmark execution
- Read/write rate metrics
- Visual performance indicators
- Historical performance tracking

### **Tag Monitoring Dashboard**
- Live tag value updates
- Error state visualization
- Start/stop monitoring controls
- Individual tag management

### **Activity Log**
- Real-time operation logging
- Color-coded message levels
- Timestamp tracking
- Scrollable history (last 100 entries)

## 🔍 Advanced Tag Examples

The dashboard includes interactive examples for advanced tag addressing:

```typescript
// Program-scoped tags
'Program:MainProgram.Motor.Status'
'Program:Safety.EmergencyStop'

// Array operations
'DataArray[5]'
'SensorReadings[10]'
'Program:Vision.ImageData[10,20,3]'

// Bit-level access
'StatusWord.15'
'Program:IO.InputBank.7'

// UDT member access
'MotorData.Speed'
'Recipe.Step1.Temperature.Setpoint'

// String operations
'ProductName.LEN'
'ProductName.DATA[5]'

// Complex nested paths
'Program:Production.Lines[2].Stations[5].Motor.Status.15'
```

## 🎯 Data Type Support

Complete support for all Allen-Bradley data types with TypeScript type safety:

| Type | Description | Range | TypeScript Type |
|------|-------------|-------|-----------------|
| BOOL | Boolean values | true/false | `boolean` |
| SINT | 8-bit signed integer | -128 to 127 | `number` |
| INT | 16-bit signed integer | -32,768 to 32,767 | `number` |
| DINT | 32-bit signed integer | -2.1B to 2.1B | `number` |
| LINT | 64-bit signed integer | Very large range | `number` |
| USINT | 8-bit unsigned integer | 0 to 255 | `number` |
| UINT | 16-bit unsigned integer | 0 to 65,535 | `number` |
| UDINT | 32-bit unsigned integer | 0 to 4.3B | `number` |
| ULINT | 64-bit unsigned integer | Very large range | `number` |
| REAL | 32-bit IEEE 754 float | ±3.4E±38 | `number` |
| LREAL | 64-bit IEEE 754 double | ±1.7E±308 | `number` |
| STRING | Variable-length strings | Text data | `string` |
| UDT | User Defined Types | Complex structures | `Record<string, unknown>` |

## 🚀 Performance Features

- **Parallel Operations**: Multiple tags read/written simultaneously
- **Real-time Monitoring**: Live updates every second
- **Benchmark Testing**: Automated performance measurement
- **Connection Pooling**: Efficient resource management (via backend)
- **Error Recovery**: Automatic reconnection and error handling

## 🔧 Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run TypeScript linter
```

### **Customization**
The dashboard is built with modularity in mind:

- **API Client**: Extend `plcApi.ts` for additional endpoints
- **Components**: Add new panels to `App.tsx`
- **Styling**: Modify `App.css` for custom themes
- **Types**: Extend interfaces in `plcApi.ts` for new features

## 🌟 Production Considerations

### **Security**
- Add authentication to the ASP.NET Core backend
- Implement HTTPS for production deployment
- Add input validation and sanitization
- Consider rate limiting for API endpoints

### **Scalability**
- Implement WebSocket connections for real-time updates
- Add Redis caching for tag values
- Use connection pooling for multiple PLCs
- Add horizontal scaling with load balancers

### **Monitoring**
- Add application performance monitoring (APM)
- Implement structured logging
- Add health checks and metrics
- Monitor PLC connection status

## 🤝 Integration Examples

### **Adding New Features**
```typescript
// Extend the API client
class ExtendedPlcApiClient extends PlcApiClient {
  async getTagHistory(tagName: string, hours: number) {
    // Implementation for historical data
  }
  
  async subscribeToTag(tagName: string, callback: (value: any) => void) {
    // Implementation for real-time subscriptions
  }
}

// Add new React components
const TagHistoryChart = ({ tagName }: { tagName: string }) => {
  // Chart component implementation
};
```

### **Custom Data Types**
```typescript
// Define custom interfaces
interface MotorStatus {
  running: boolean;
  speed: number;
  current: number;
  faults: number;
}

// Type-safe tag operations
const motorStatus = await plcApi.readTag('Motor1') as MotorStatus;
```

## 📚 Related Examples

- **[ASP.NET Core Example](../AspNetExample/)** - Backend API implementation
- **[WPF Example](../WpfExample/)** - Desktop application
- **[WinForms Example](../WinFormsExample/)** - Windows Forms application

## 🎯 Next Steps

1. **Explore the Dashboard**: Connect to your PLC and try different tag operations
2. **Customize the UI**: Modify components and styling to match your needs
3. **Add Features**: Implement additional functionality like charts or alarms
4. **Deploy to Production**: Set up proper hosting and security measures

---

**🦀 Powered by Rust EtherNet/IP v0.3.0** - Production-ready industrial automation for the modern web! 