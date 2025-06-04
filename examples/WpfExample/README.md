# 🦀 Rust EtherNet/IP WPF Example

A modern Windows Presentation Foundation (WPF) application demonstrating the Rust EtherNet/IP library with real-time tag monitoring, performance benchmarking, and **high-performance batch operations**.

## 🚀 Features

### Core Functionality
- **Real-time Tag Monitoring**: Automatic refresh of tag values
- **Tag Discovery**: Automatic type detection for PLC tags with comprehensive support
- **Performance Benchmarking**: Measure read/write speeds
- **🆕 Batch Operations**: High-performance multi-tag read/write operations
- **Modern WPF UI**: Clean, responsive interface with MVVM pattern

### Supported Data Types
- **BOOL**: Boolean values (true/false)
- **SINT/INT/DINT/LINT**: Signed integers (8/16/32/64-bit)
- **USINT/UINT/UDINT/ULINT**: Unsigned integers (8/16/32/64-bit)
- **REAL/LREAL**: Floating point numbers (32/64-bit)

⚠️ **Note**: STRING and UDT tags are not supported in the current Rust library implementation.

## 🚀 New Batch Operations

### Batch Read Operations
- **Multi-tag Reading**: Read multiple tags in a single optimized operation
- **Performance Metrics**: Real-time timing and success rate monitoring
- **3-10x Speed Improvement**: Significant performance gains over individual operations

### Batch Write Operations  
- **Atomic Writes**: Write multiple tags simultaneously
- **Smart Type Detection**: Automatic value type parsing (bool, int, float, string)
- **Error Handling**: Individual tag success/failure reporting

### Features:
```
🚀 Batch Read: Read 4+ tags simultaneously
✏️ Batch Write: Update multiple tags atomically  
📊 Performance Monitoring: Real-time metrics display
⚡ Speed Optimization: 3-10x faster than individual operations
```

## 🎯 Test Tags Setup

For optimal testing experience, create these test tags in your PLC:

| Tag Name | Data Type | Description |
|----------|-----------|-------------|
| `TestTag` | BOOL | Boolean test value |
| `TestBool` | BOOL | Another boolean for testing |
| `TestInt` | DINT | 32-bit integer test value |
| `TestReal` | REAL | Floating point test value |

Use the **"Create Test Tags"** button to automatically create these tags in your PLC.

## 🚀 Getting Started

### Prerequisites
- .NET 9.0 or later
- Windows OS (for WPF)
- Allen-Bradley CompactLogix PLC (or compatible)

### Building and Running

```bash
# Clone the repository
git clone https://github.com/your-repo/rust-ethernet-ip
cd rust-ethernet-ip/examples/WpfExample

# Build the application
dotnet build

# Run the application
dotnet run
```

### Connecting to Your PLC

1. **Enter PLC Address**: Default is `192.168.0.1:44818`
2. **Click Connect**: Establishes EtherNet/IP session
3. **Verify Connection**: Status shows "Connected" with session ID

## 📖 Usage Guide

### Individual Operations

#### Tag Discovery
1. Enter a tag name in the discovery field
2. Click **"Discover Tag"** to auto-detect its data type
3. The tag will be added to the monitoring list

#### Manual Tag Operations
1. Enter tag name, select data type, and enter value
2. Click **"Read"** to get current value from PLC
3. Click **"Write"** to update the tag value in PLC

### 🚀 Batch Operations (New!)

#### Batch Read
1. Navigate to the **"🚀 Batch Operations"** tab
2. Enter tag names in the Batch Read section (one per line):
   ```
   TestTag
   TestBool
   TestInt
   TestReal
   ```
3. Click **"🚀 Execute Batch Read"**
4. View results and performance metrics in real-time

#### Batch Write
1. In the Batch Write section, enter tag=value pairs (one per line):
   ```
   TestTag=true
   TestBool=false
   TestInt=999
   TestReal=88.8
   ```
2. Click **"✏️ Execute Batch Write"**
3. Monitor individual tag success/failure status
4. View performance improvements vs individual operations

### Real-time Monitoring
- All discovered/read tags appear in the monitoring grid
- Values update automatically when connected
- Error states are highlighted in red

### Performance Testing
1. Click **"Run Benchmark"** to test read/write speeds
2. Results show operations per second performance
3. Helps verify PLC connectivity and performance

## 🏗️ Architecture

### MVVM Pattern
- **MainViewModel**: Handles all business logic and PLC communication
- **MainWindow**: Pure XAML UI with data binding
- **PlcTag Model**: Represents individual tag state
- **Converters**: UI state conversion helpers

### Key Components
- **EtherNet/IP Client**: Direct C# wrapper for Rust library
- **Async Operations**: Non-blocking PLC communication
- **Error Handling**: Comprehensive retry logic and error reporting
- **Performance Monitoring**: Built-in timing and metrics

## 🔧 Troubleshooting

### Common Issues

#### Connection Problems
- **Verify PLC IP address and port (typically 44818)**
- **Check network connectivity**
- **Ensure EtherNet/IP is enabled on PLC**
- **Verify firewall settings**

#### Tag Access Issues
- **Verify tag names match exactly (case-sensitive)**
- **Check tag data types match selection**
- **Ensure sufficient PLC permissions**
- **Try tag discovery first before manual operations**

#### Performance Issues
- **Network latency affects operation speed**
- **Older PLCs may have slower response times**
- **Multiple applications accessing PLC can cause delays**

## 📊 Performance Notes

The WPF application focuses on individual tag operations and real-time monitoring. For high-performance batch operations, see the WinForms example which includes comprehensive batch processing capabilities.

## 🛡️ Data Type Support

Currently supported by the Rust EtherNet/IP library:
✅ BOOL, SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT, REAL, LREAL

Not yet supported:
❌ STRING, UDT (User Defined Types)

## 🔄 Real-time Updates

When connected, the application automatically refreshes tag values every 100ms, providing near real-time monitoring of your PLC data. This makes it ideal for:
- Process monitoring dashboards
- Debugging PLC programs
- Verifying tag connectivity
- Performance analysis 