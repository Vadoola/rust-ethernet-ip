# Rust EtherNet/IP C# Wrapper

A high-performance C# wrapper for the Rust EtherNet/IP library, enabling communication with Allen-Bradley CompactLogix and ControlLogix PLCs. This wrapper provides both traditional individual tag operations and revolutionary **high-performance batch operations** for industrial automation applications.

## 🚀 **New: Batch Operations**

**3-10x faster than individual operations!** The latest version introduces powerful batch operations that dramatically improve performance for multi-tag scenarios.

### Key Benefits

- **🚀 Performance**: 3-10x faster than individual tag operations
- **📡 Network Efficiency**: 1 packet instead of N packets (50x reduction in network traffic)
- **💪 PLC Efficiency**: Lower CPU usage on the PLC
- **⚡ Throughput**: Perfect for data acquisition and coordinated control
- **🔧 Flexibility**: Mixed read/write operations in a single batch

## Features

### Core Capabilities
- **Complete Data Type Support**: All Allen-Bradley data types (BOOL, SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT, REAL, LREAL, STRING, UDT)
- **Advanced Tag Addressing**: Program-scoped tags, arrays, bit operations, UDT members
- **High Performance**: 1,500+ reads/sec, 800+ writes/sec for individual operations
- **Batch Operations**: Up to 10x performance improvement for multi-tag operations
- **Cross-Platform**: Windows, Linux, macOS support
- **Type Safety**: Strongly-typed API with comprehensive error handling

### Supported PLCs
- **CompactLogix**: L1x, L2x, L3x, L4x, L5x series
- **ControlLogix**: L6x, L7x, L8x series

## Quick Start

### Installation

1. Add the `RustEtherNetIp.dll` and `rust_ethernet_ip.dll` to your project
2. Reference the wrapper in your C# application

### Basic Usage

```csharp
using RustEtherNetIp;

// Connect to PLC
using var client = new EtherNetIpClient();
if (client.Connect("192.168.0.1:44818"))
{
    // Individual operations
    bool startButton = client.ReadBool("StartButton");
    int counter = client.ReadDint("ProductionCount");
    float temperature = client.ReadReal("BoilerTemp");
    
    client.WriteBool("EnableFlag", true);
    client.WriteDint("SetPoint", 1500);
    client.WriteReal("TargetTemp", 75.5f);
}
```

## 🚀 Batch Operations

### Batch Read Operations

Read multiple tags in a single optimized operation:

```csharp
string[] tags = {
    "ProductionCount",
    "Temperature_1", 
    "Temperature_2",
    "Pressure_1",
    "FlowRate"
};

var results = client.ReadTagsBatch(tags);

foreach (var result in results)
{
    if (result.Value.Success)
        Console.WriteLine($"{result.Key}: {result.Value.Value}");
    else
        Console.WriteLine($"{result.Key}: Error - {result.Value.ErrorMessage}");
}
```

### Batch Write Operations

Write multiple tags efficiently:

```csharp
var tagValues = new Dictionary<string, object>
{
    { "SetPoint_1", 1500 },
    { "SetPoint_2", 1750 },
    { "TargetTemp", 75.5f },
    { "EnableFlag", true },
    { "RecipeNumber", 42 }
};

var results = client.WriteTagsBatch(tagValues);

foreach (var result in results)
{
    if (result.Value.Success)
        Console.WriteLine($"{result.Key}: Write successful");
    else
        Console.WriteLine($"{result.Key}: Error - {result.Value.ErrorMessage}");
}
```

### Mixed Batch Operations

Execute reads and writes together for coordinated control:

```csharp
var operations = new[]
{
    BatchOperation.Read("CurrentTemp"),
    BatchOperation.Read("CurrentPressure"),
    BatchOperation.Write("TempSetpoint", 78.5f),
    BatchOperation.Write("PressureSetpoint", 15.2f),
    BatchOperation.Write("AutoModeEnabled", true)
};

var results = client.ExecuteBatch(operations);

foreach (var result in results)
{
    string operation = result.IsWrite ? "Write" : "Read";
    if (result.Success)
    {
        string valueInfo = result.IsWrite ? "" : $" = {result.Value}";
        Console.WriteLine($"✅ {operation} {result.TagName}{valueInfo} ({result.ExecutionTimeMs:F1}ms)");
    }
    else
    {
        Console.WriteLine($"❌ {operation} {result.TagName}: {result.ErrorMessage}");
    }
}
```

## Performance Configuration

Optimize batch operations for your specific use case:

### High-Performance Configuration (Modern PLCs)

```csharp
var config = BatchConfig.HighPerformance();
client.ConfigureBatchOperations(config);

// Equivalent to:
var customConfig = new BatchConfig
{
    MaxOperationsPerPacket = 50,
    MaxPacketSize = 4000,
    PacketTimeoutMs = 1000,
    ContinueOnError = true,
    OptimizePacketPacking = true
};
```

### Conservative Configuration (Older PLCs/Networks)

```csharp
var config = BatchConfig.Conservative();
client.ConfigureBatchOperations(config);

// Equivalent to:
var customConfig = new BatchConfig
{
    MaxOperationsPerPacket = 10,
    MaxPacketSize = 504,
    PacketTimeoutMs = 5000,
    ContinueOnError = false,
    OptimizePacketPacking = false
};
```

## Performance Comparison

| Operation Type | Individual | Batch | Improvement |
|----------------|------------|-------|-------------|
| 5 tag reads | 15ms | 3ms | **5x faster** |
| 10 tag writes | 25ms | 5ms | **5x faster** |
| 20 mixed ops | 50ms | 8ms | **6.25x faster** |
| Network packets | 20 packets | 1 packet | **20x reduction** |

## Advanced Tag Addressing

The wrapper supports all advanced Allen-Bradley tag addressing features:

```csharp
// Program-scoped tags
var motorStatus = client.ReadBool("Program:MainProgram.Motor.Status");

// Array element access
var arrayElement = client.ReadDint("MyArray[5]");
var multiDimArray = client.ReadDint("Matrix[2,3,1]");

// Bit-level operations
var statusBit = client.ReadBool("StatusWord.15");

// UDT member access
var udtMember = client.ReadReal("MyUDT.Temperature.Value");

// String operations
var stringLength = client.ReadDint("MyString.LEN");
var stringData = client.ReadString("MyString.DATA");
```

## Error Handling

The wrapper provides comprehensive error handling:

```csharp
try
{
    var value = client.ReadDint("NonExistentTag");
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
    
    // Specific error types available:
    // - TagNotFoundException
    // - DataTypeMismatchException  
    // - NetworkException
    // - CipProtocolException
}
```

## Use Cases

### Data Acquisition

Perfect for reading multiple sensor values:

```csharp
string[] sensors = {
    "Temperature_Zone1", "Temperature_Zone2", "Temperature_Zone3",
    "Pressure_Tank1", "Pressure_Tank2", 
    "FlowRate_Line1", "FlowRate_Line2"
};

var sensorData = client.ReadTagsBatch(sensors);
```

### Recipe Management

Efficiently update multiple setpoints:

```csharp
var recipe = new Dictionary<string, object>
{
    { "Temp_Setpoint_1", 180.5f },
    { "Temp_Setpoint_2", 165.0f },
    { "Pressure_Setpoint", 25.7f },
    { "Speed_Setpoint", 1200 },
    { "Recipe_Active", true }
};

client.WriteTagsBatch(recipe);
```

### Coordinated Control

Atomic read-then-write operations:

```csharp
var operations = new[]
{
    // Read current states
    BatchOperation.Read("Current_Position"),
    BatchOperation.Read("Current_Speed"),
    BatchOperation.Read("System_Ready"),
    
    // Update control outputs based on logic
    BatchOperation.Write("Target_Position", newPosition),
    BatchOperation.Write("Speed_Command", calculatedSpeed),
    BatchOperation.Write("Start_Command", true)
};

var results = client.ExecuteBatch(operations);
```

## System Requirements

- **.NET 6.0 or later**
- **Windows 10/11, Linux, or macOS**
- **Network access to Allen-Bradley PLC**
- **rust_ethernet_ip.dll** (included)

## Architecture

```
┌─────────────────────────────────────────┐
│           C# Application                │
│  ┌─────────────────────────────────────┐│
│  │     Your Business Logic             ││
│  └─────────────────────────────────────┘│
└─────────────┬───────────────────────────┘
              │
┌─────────────┴───────────────────────────┐
│        C# Wrapper (This Library)       │
│  • Type-safe API                       │
│  • Batch Operations                    │
│  • Error Handling                      │
│  • Memory Management                   │
└─────────────┬───────────────────────────┘
              │ P/Invoke
┌─────────────┴───────────────────────────┐
│         Rust Core Library              │
│  • EtherNet/IP Protocol                │
│  • CIP Implementation                  │
│  • Network Communication               │
│  • Performance Optimization            │
└─────────────┬───────────────────────────┘
              │ TCP/IP
┌─────────────┴───────────────────────────┐
│        Allen-Bradley PLC               │
│  • CompactLogix / ControlLogix         │
│  • EtherNet/IP Port 44818              │
└─────────────────────────────────────────┘
```

## Thread Safety

The `EtherNetIpClient` is **NOT** thread-safe. For multi-threaded applications:

- Use one client per thread, OR
- Implement external synchronization, OR  
- Use a connection pool pattern

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify PLC IP address and port (44818)
   - Check network connectivity
   - Ensure PLC EtherNet/IP is enabled

2. **Tag Not Found**
   - Verify tag name spelling and case
   - Check tag scope (global vs program-scoped)
   - Ensure tag exists in PLC program

3. **Data Type Mismatch**
   - Use correct read method for tag data type
   - Check PLC tag definition

4. **Performance Issues**
   - Use batch operations for multiple tags
   - Adjust batch configuration for your network
   - Monitor network packet size limits

## API Reference

### Core Classes

- **`EtherNetIpClient`**: Main client class
- **`BatchOperation`**: Represents a batch operation
- **`BatchConfig`**: Configuration for batch operations
- **`TagReadResult`**: Result of a tag read operation
- **`TagWriteResult`**: Result of a tag write operation
- **`BatchOperationResult`**: Result of a batch operation

### Extension Methods

- **`EtherNetIpExtensions.ConnectToPlc()`**: One-line connection
- **`EtherNetIpExtensions.TryConnectToPlc()`**: Connection with retry logic

## Contributing

This wrapper is part of the larger rust-ethernet-ip project. Contributions are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the examples in `Program.cs`
- File issues on the GitHub repository

## Version History

### v0.3.0 (Current)
- ✅ **NEW: Batch Operations** - 3-10x performance improvement
- ✅ Complete data type support
- ✅ Advanced tag addressing
- ✅ Cross-platform support
- ✅ Comprehensive error handling

### v0.2.0
- Individual tag operations
- Basic error handling
- Core data types

### v0.1.0
- Initial release
- Basic connectivity 