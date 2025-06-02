# RustEtherNetIp C# Wrapper

A high-performance C# wrapper for the Rust EtherNet/IP communication library, providing comprehensive integration with Allen-Bradley CompactLogix and ControlLogix PLCs.

## Features

- **High Performance**: 1,500+ reads/sec, 800+ writes/sec with direct FFI calls to Rust library
- **Complete Data Type Support**: All Allen-Bradley native data types (BOOL, SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT, REAL, LREAL, STRING, UDT)
- **Advanced Tag Addressing**: Program-scoped tags, array elements, bit operations, UDT member access
- **Type Safety**: Strongly typed API with compile-time type checking
- **Error Handling**: Comprehensive CIP error code mapping and detailed error messages
- **Connection Management**: Robust session handling with automatic cleanup
- **Tag Discovery**: Automatic tag list upload and metadata caching
- **Multiple PLC Support**: Concurrent connections to multiple PLCs
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Supported PLCs

- **CompactLogix**: L1x, L2x, L3x, L4x, L5x series
- **ControlLogix**: L6x, L7x, L8x series
- **MicroLogix**: 1100, 1400 series (basic support)

## Quick Start

1. Add the library to your project:
```xml
<PackageReference Include="RustEtherNetIp" Version="0.3.0" />
```

2. Basic usage:
```csharp
using RustEtherNetIp;

using var client = new EtherNetIpClient();
if (client.Connect("192.168.1.100:44818"))
{
    // Read different data types
    bool motorRunning = client.ReadBool("MotorRunning");
    int productionCount = client.ReadDint("ProductionCount");
    float temperature = client.ReadReal("BoilerTemp");
    
    // Write values
    client.WriteBool("StartButton", true);
    client.WriteDint("SetPoint", 1500);
    client.WriteReal("TargetTemp", 72.5f);
}
```

## Advanced Tag Addressing

The library supports sophisticated tag addressing patterns:

```csharp
// Program-scoped tags
bool status = client.ReadBool("Program:MainProgram.Motor.Status");

// Array element access
int value = client.ReadDint("DataArray[5]");
int value2D = client.ReadDint("Matrix[2,3]");

// Bit-level operations
bool bit15 = client.ReadBool("StatusWord.15");

// UDT member access
float speed = client.ReadReal("MotorData.Speed");
string status = client.ReadString("MotorData.Status.Message");

// String operations
int length = client.ReadDint("ProductName.LEN");
byte charData = client.ReadUsint("ProductName.DATA[0]");

// Complex nested paths
bool alarmActive = client.ReadBool("Program:Production.Lines[2].Stations[5].Motor.Alarms.15");
```

## Complete Data Type Support

### Integer Types
```csharp
// Signed integers
sbyte sintValue = client.ReadSint("ByteTag");        // -128 to 127
short intValue = client.ReadInt("ShortTag");         // -32,768 to 32,767
int dintValue = client.ReadDint("IntTag");           // -2.1B to 2.1B
long lintValue = client.ReadLint("LongTag");         // -9.2E18 to 9.2E18

// Unsigned integers
byte usintValue = client.ReadUsint("UByteTag");      // 0 to 255
ushort uintValue = client.ReadUint("UShortTag");     // 0 to 65,535
uint udintValue = client.ReadUdint("UIntTag");       // 0 to 4.3B
ulong ulintValue = client.ReadUlint("ULongTag");     // 0 to 1.8E19
```

### Floating Point Types
```csharp
// IEEE 754 floating point
float realValue = client.ReadReal("TempTag");        // 32-bit float
double lrealValue = client.ReadLreal("PrecisionTag"); // 64-bit double
```

### Other Types
```csharp
// Boolean and string
bool boolValue = client.ReadBool("StatusTag");
string stringValue = client.ReadString("MessageTag");

// User Defined Types
var udtValue = client.ReadUdt("MotorData");
```

## Error Handling

The wrapper provides comprehensive error handling with detailed CIP error codes:

```csharp
try
{
    int value = client.ReadDint("NonExistentTag");
}
catch (Exception ex) when (ex.Message.Contains("CIP Error 0x16"))
{
    Console.WriteLine("Tag does not exist");
}
catch (Exception ex) when (ex.Message.Contains("CIP Error 0x0F"))
{
    Console.WriteLine("Access denied - check tag permissions");
}
catch (Exception ex)
{
    Console.WriteLine($"Communication error: {ex.Message}");
}
```

## Performance Optimization

```csharp
using var client = new EtherNetIpClient();
client.Connect("192.168.1.100:44818");

// Set optimal packet size for your network
client.SetMaxPacketSize(4000);

// Discover tags once for metadata caching
client.DiscoverTags();

// Check connection health
if (!client.CheckHealth())
{
    // Handle connection issues
}
```

## Connection Management

### Single Connection
```csharp
using var client = new EtherNetIpClient();
if (client.Connect("192.168.1.100:44818"))
{
    // Use client...
} // Automatically disconnects and cleans up
```

### Multiple Connections
```csharp
var clients = new List<EtherNetIpClient>();

try
{
    // Connect to multiple PLCs
    foreach (var address in plcAddresses)
    {
        var client = EtherNetIpExtensions.TryConnectToPlc(address, maxRetries: 3);
        if (client != null)
            clients.Add(client);
    }
    
    // Use clients...
}
finally
{
    // Clean up all connections
    foreach (var client in clients)
        client.Dispose();
}
```

## Tag Discovery and Metadata

```csharp
using var client = new EtherNetIpClient();
client.Connect("192.168.1.100:44818");

// Discover all tags in the PLC
client.DiscoverTags();

// Get metadata for specific tags
var metadata = client.GetTagMetadata("ProductionCount");
Console.WriteLine($"Data Type: 0x{metadata.DataType:X2}");
Console.WriteLine($"Scope: {metadata.Scope}");
Console.WriteLine($"Array Dimensions: {metadata.ArrayDimension}");
```

## Real-Time Monitoring Example

```csharp
using var client = new EtherNetIpClient();
client.Connect("192.168.1.100:44818");

var cancellationToken = new CancellationTokenSource();

// Monitor tags in real-time
_ = Task.Run(async () =>
{
    while (!cancellationToken.Token.IsCancellationRequested)
    {
        try
        {
            var temp = client.ReadReal("BoilerTemp");
            var pressure = client.ReadReal("BoilerPressure");
            var running = client.ReadBool("MotorRunning");
            
            Console.WriteLine($"Temp: {temp:F1}°C, Pressure: {pressure:F1} PSI, Running: {running}");
            
            await Task.Delay(1000, cancellationToken.Token);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Monitoring error: {ex.Message}");
            await Task.Delay(5000, cancellationToken.Token); // Retry after delay
        }
    }
}, cancellationToken.Token);

Console.WriteLine("Press any key to stop monitoring...");
Console.ReadKey();
cancellationToken.Cancel();
```

## Performance Characteristics

| Operation | Latency | Throughput | Notes |
|-----------|---------|------------|-------|
| Read BOOL | 1-3ms | 1,500+ ops/sec | Single tag operations |
| Read DINT | 1-3ms | 1,400+ ops/sec | 32-bit integer tags |
| Read REAL | 1-5ms | 1,300+ ops/sec | Floating point tags |
| Write BOOL | 2-5ms | 800+ ops/sec | Single tag operations |
| Write DINT | 2-5ms | 750+ ops/sec | 32-bit integer tags |
| Write REAL | 2-10ms | 700+ ops/sec | Floating point tags |
| Connection | 100-500ms | N/A | Initial session setup |
| Tag Discovery | 1-5s | N/A | Depends on tag count |

## Thread Safety

The `EtherNetIpClient` is **not** thread-safe. For multi-threaded applications:

```csharp
// Option 1: Use one client per thread
var client = new EtherNetIpClient();

// Option 2: Use external synchronization
private readonly object _lockObject = new object();

lock (_lockObject)
{
    var value = client.ReadDint("Tag1");
}

// Option 3: Use async-safe patterns
private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

await _semaphore.WaitAsync();
try
{
    var value = client.ReadDint("Tag1");
}
finally
{
    _semaphore.Release();
}
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details. 