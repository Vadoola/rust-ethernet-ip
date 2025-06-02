# 🦀 Rust EtherNet/IP - TypeScript Dashboard

A modern web dashboard for communicating with Allen-Bradley PLCs using the Rust EtherNet/IP library. This application provides a React TypeScript frontend that communicates with an ASP.NET Core backend, which in turn uses the Rust library for PLC communication.

## 🚀 Quick Start

### Prerequisites
- .NET 9.0 SDK
- Node.js 18+ and npm
- Rust (for building the library)
- Allen-Bradley CompactLogix or ControlLogix PLC

### 1. Start the Backend
```bash
cd examples/AspNetExample
dotnet run
```
The backend will start on `https://localhost:5001` and `http://localhost:5000`

### 2. Start the Frontend
```bash
cd examples/TypeScriptExample/frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`

### 3. Connect to Your PLC
1. Open your browser to `http://localhost:5173`
2. Enter your PLC address (e.g., `192.168.1.100:44818`)
3. Click "Connect"

## 🔧 Troubleshooting

### Issue: Cannot type in PLC Address field
**Cause**: The input field is disabled when connected or connecting.
**Solution**: 
1. Make sure you see "Disconnected" status in the header
2. If stuck in "Connected" state, refresh the page
3. Check browser console for React state debugging logs

### Issue: Connection fails or "Backend API not responding"
**Possible Causes**:
1. **Backend not running**: Make sure ASP.NET Core backend is running on port 5000/5001
2. **CORS issues**: Backend should have CORS configured for localhost
3. **Port conflicts**: Check if ports 5000/5001 are available

**Solutions**:
1. **Check backend status**:
   ```bash
   curl http://localhost:5000/api/plc/status
   # or
   curl https://localhost:5001/api/plc/status
   ```

2. **Restart backend**:
   ```bash
   cd examples/AspNetExample
   dotnet clean
   dotnet run
   ```

3. **Check backend logs**: Look for any errors in the ASP.NET Core console

### Issue: PLC connection fails
**Possible Causes**:
1. **Incorrect IP address**: Verify PLC network settings
2. **Port issues**: Default port is 44818 for EtherNet/IP
3. **Network connectivity**: Check if you can ping the PLC
4. **Firewall**: Windows/network firewall blocking connection

**Solutions**:
1. **Test network connectivity**:
   ```bash
   ping 192.168.1.100
   telnet 192.168.1.100 44818
   ```

2. **Verify PLC settings**: Check PLC's Ethernet configuration

3. **Try different address format**: `192.168.1.100:44818`

## 🐛 Debug Mode

### Enable Debug Logging
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for debug messages:
   - `Connection state changed:` - Shows React state updates
   - `PLC address changed:` - Shows input field changes
   - `Address input changed:` - Shows typing in input field

### Backend API Testing
You can test the backend directly:

```bash
# Check status
curl http://localhost:5000/api/plc/status

# Connect to PLC
curl -X POST http://localhost:5000/api/plc/connect \
  -H "Content-Type: application/json" \
  -d '{"address": "192.168.1.100:44818"}'

# Read a tag
curl http://localhost:5000/api/plc/tag/TestBool
```

## 📊 Features

### Implemented
- ✅ PLC Connection Management
- ✅ Tag Discovery and Type Detection
- ✅ Read/Write operations for all data types
- ✅ Real-time tag monitoring
- ✅ Performance benchmarking
- ✅ Activity logging
- ✅ Responsive design

### Data Types Supported
- BOOL, SINT, INT, DINT, LINT
- USINT, UINT, UDINT, ULINT  
- REAL, LREAL, STRING, UDT

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                      │
│                 (TypeScript + Vite)                    │
│                  localhost:5173                        │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP REST API
┌─────────────────────┴───────────────────────────────────┐
│                ASP.NET Core Backend                    │
│                  localhost:5000/5001                   │
└─────────────────────┬───────────────────────────────────┘
                      │ C# FFI Bindings
┌─────────────────────┴───────────────────────────────────┐
│                 Rust EtherNet/IP Library               │
│              (rust_ethernet_ip.dll)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ TCP/IP EtherNet/IP Protocol
┌─────────────────────┴───────────────────────────────────┐
│              Allen-Bradley PLC                         │
│           (CompactLogix/ControlLogix)                   │
└─────────────────────────────────────────────────────────┘
```

## 🚦 Common Workflows

### Reading a Tag
1. Connect to PLC
2. Enter tag name in "Tag Discovery" section
3. Click "Discover" to detect type
4. Click "Read" to get current value

### Writing a Tag  
1. Follow steps 1-3 above
2. Change value in the "Value" field
3. Select correct data type if needed
4. Click "Write"

### Monitoring Multiple Tags
1. Discover and read tags as above
2. Click "Monitor" to add to monitoring panel
3. Toggle "Start Monitoring" for real-time updates
4. Remove tags with the "×" button

## 🔧 Development

### Building from Source
```bash
# Build Rust library
cargo build --release

# Build and run backend
cd examples/AspNetExample
dotnet build
dotnet run

# Build and run frontend
cd examples/TypeScriptExample/frontend
npm install
npm run build
npm run dev
```

### Project Structure
```
examples/TypeScriptExample/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── api/plcApi.ts    # Backend communication
│   │   ├── App.tsx          # Main application
│   │   └── App.css          # Styling
│   └── package.json
├── start-backend.bat        # Windows batch script
├── start-frontend.bat       # Windows batch script
└── README.md               # This file
```

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

## 🎯 Next Steps

1. **Explore the Dashboard**: Connect to your PLC and try different tag operations
2. **Customize the UI**: Modify components and styling to match your needs
3. **Add Features**: Implement additional functionality like charts or alarms
4. **Deploy to Production**: Set up proper hosting and security measures

---

**🦀 Powered by Rust EtherNet/IP v0.3.0** - Production-ready industrial automation for the modern web! 