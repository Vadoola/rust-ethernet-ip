# RustEtherNetIp C# Wrapper

A high-performance C# wrapper for the Rust EtherNet/IP communication library, providing seamless integration with Allen-Bradley CompactLogix PLCs.

## Features

- **High Performance**: Direct FFI calls to Rust library with minimal overhead
- **Type Safety**: Strongly typed API for all PLC data types
- **Error Handling**: Detailed error messages and exception handling
- **Connection Management**: Automatic session handling and cleanup
- **Tag Discovery**: Automatic tag list upload and caching
- **Multiple PLC Support**: Concurrent connections to multiple PLCs
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Start

1. Add the NuGet package to your project:
```xml
<PackageReference Include="RustEtherNetIp" Version="0.1.0" />
```

2. Create a client instance:
```csharp
using RustEtherNetIp;

var client = new EthernetNetIpClient("192.168.0.1", 44818);
```

3. Connect to the PLC:
```csharp
await client.ConnectAsync();
```

4. Read and write tags:
```csharp
// Read a DINT tag
int value = await client.ReadDintAsync("TestDint");

// Write a DINT tag
await client.WriteDintAsync("TestDint", 42);

// Read a BOOL tag
bool state = await client.ReadBoolAsync("TestBool");

// Write a BOOL tag
await client.WriteBoolAsync("TestBool", true);
```

5. Disconnect when done:
```csharp
await client.DisconnectAsync();
```

## Example Applications

### ASP.NET Web Application
A complete web application example is available in the `examples/AspNetExample` directory. It demonstrates:
- RESTful API endpoints for PLC communication
- Real-time tag monitoring
- Tag value history
- Error handling and logging
- Connection management

### WPF Desktop Application
A complete desktop application example is available in the `examples/WpfExample` directory. It demonstrates:
- Real-time tag monitoring
- Tag value history
- Error handling and logging
- Connection management
- User interface best practices

### WinForms Desktop Application
A complete desktop application example is available in the `examples/WinFormsExample` directory. It demonstrates:
- Real-time tag monitoring
- Tag value history
- Error handling and logging
- Connection management
- User interface best practices

## Error Handling

The wrapper provides detailed error messages for all operations. Common errors include:
- Connection failures
- Tag not found
- Tag is read-only
- Invalid data type
- Access denied

Example error handling:
```csharp
try
{
    await client.WriteDintAsync("TestDint", 42);
}
catch (EtherNetIpException ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
```

## Performance

The wrapper is designed for high performance:
- Direct FFI calls to Rust library
- Minimal memory allocation
- Efficient connection pooling
- Automatic session management
- Optimized tag caching

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 