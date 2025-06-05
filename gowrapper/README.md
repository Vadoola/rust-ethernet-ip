# Rust EtherNet/IP Go Wrapper

This Go package provides a wrapper around the Rust EtherNet/IP library, enabling Go applications to communicate with Allen-Bradley CompactLogix and ControlLogix PLCs using the EtherNet/IP protocol.

## Features

- High-performance PLC communication through Rust FFI
- Support for all major PLC data types (BOOL, SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT, REAL, LREAL, STRING)
- Connection management and health monitoring
- Type-safe API with error handling
- Concurrent access support
- Batch operations support

## Prerequisites

- Go 1.21 or later
- CGO enabled
- Rust EtherNet/IP library compiled as a shared library
- Windows, Linux, or macOS

## Installation

1. Ensure the Rust library is built:
```bash
cd .. # Navigate to the main project directory
cargo build --release --features ffi
```

2. Initialize the Go module:
```bash
go mod init your-project-name
go mod tidy
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    
    "github.com/sergiogallegos/rust-ethernet-ip-go"
)

func main() {
    // Connect to PLC
    client, err := ethernetip.NewClient("192.168.1.100")
    if err != nil {
        log.Fatalf("Failed to connect to PLC: %v", err)
    }
    defer client.Close()

    // Write a boolean value
    err = client.WriteBool("MyBoolTag", true)
    if err != nil {
        log.Printf("Failed to write boolean: %v", err)
        return
    }

    // Read the boolean value back
    value, err := client.ReadBool("MyBoolTag")
    if err != nil {
        log.Printf("Failed to read boolean: %v", err)
        return
    }
    
    fmt.Printf("Boolean value: %t\n", value)

    // Work with integers
    err = client.WriteDint("MyIntTag", 12345)
    if err != nil {
        log.Printf("Failed to write integer: %v", err)
        return
    }

    intValue, err := client.ReadDint("MyIntTag")
    if err != nil {
        log.Printf("Failed to read integer: %v", err)
        return
    }
    
    fmt.Printf("Integer value: %d\n", intValue)

    // Work with strings
    err = client.WriteString("MyStringTag", "Hello PLC!")
    if err != nil {
        log.Printf("Failed to write string: %v", err)
        return
    }

    stringValue, err := client.ReadString("MyStringTag")
    if err != nil {
        log.Printf("Failed to read string: %v", err)
        return
    }
    
    fmt.Printf("String value: %s\n", stringValue)
}
```

## API Reference

### Connection Management

#### `NewClient(ipAddress string) (*EipClient, error)`
Creates a new connection to a PLC at the specified IP address.

#### `(*EipClient) Close() error`
Closes the connection to the PLC.

#### `(*EipClient) CheckHealth() (bool, error)`
Checks if the PLC connection is healthy.

#### `(*EipClient) SetMaxPacketSize(size int) error`
Sets the maximum packet size for communications.

### Data Type Operations

#### Boolean Operations
- `ReadBool(tagName string) (bool, error)`
- `WriteBool(tagName string, value bool) error`

#### Signed Integer Operations
- `ReadSint(tagName string) (int8, error)` - 8-bit signed integer
- `WriteSint(tagName string, value int8) error`
- `ReadInt(tagName string) (int16, error)` - 16-bit signed integer
- `WriteInt(tagName string, value int16) error`
- `ReadDint(tagName string) (int32, error)` - 32-bit signed integer
- `WriteDint(tagName string, value int32) error`
- `ReadLint(tagName string) (int64, error)` - 64-bit signed integer
- `WriteLint(tagName string, value int64) error`

#### Unsigned Integer Operations
- `ReadUsint(tagName string) (uint8, error)` - 8-bit unsigned integer
- `WriteUsint(tagName string, value uint8) error`
- `ReadUint(tagName string) (uint16, error)` - 16-bit unsigned integer
- `WriteUint(tagName string, value uint16) error`
- `ReadUdint(tagName string) (uint32, error)` - 32-bit unsigned integer
- `WriteUdint(tagName string, value uint32) error`
- `ReadUlint(tagName string) (uint64, error)` - 64-bit unsigned integer
- `WriteUlint(tagName string, value uint64) error`

#### Floating Point Operations
- `ReadReal(tagName string) (float64, error)` - 32-bit float
- `WriteReal(tagName string, value float64) error`
- `ReadLreal(tagName string) (float64, error)` - 64-bit float
- `WriteLreal(tagName string, value float64) error`

#### String Operations
- `ReadString(tagName string) (string, error)`
- `WriteString(tagName string, value string) error`

### Generic Operations

#### `ReadValue(tagName string, dataType PlcDataType) (*PlcValue, error)`
Reads a value with automatic type handling.

#### `WriteValue(tagName string, value *PlcValue) error`
Writes a value with automatic type handling.

### Data Types

#### `PlcDataType`
Enumeration of supported PLC data types:
- `Bool` - Boolean
- `Sint` - 8-bit signed integer
- `Int` - 16-bit signed integer
- `Dint` - 32-bit signed integer
- `Lint` - 64-bit signed integer
- `Usint` - 8-bit unsigned integer
- `Uint` - 16-bit unsigned integer
- `Udint` - 32-bit unsigned integer
- `Ulint` - 64-bit unsigned integer
- `Real` - 32-bit floating point
- `Lreal` - 64-bit floating point
- `String` - String data

#### `PlcValue`
Represents a value that can be read from or written to the PLC:
```go
type PlcValue struct {
    Type  PlcDataType
    Value interface{}
}
```

#### `EipError`
Custom error type for EtherNet/IP operations:
```go
type EipError struct {
    Code    int
    Message string
}
```

## Error Handling

All operations return errors that implement the standard Go error interface. EtherNet/IP specific errors are returned as `*EipError` which includes both an error code and descriptive message.

```go
client, err := ethernetip.NewClient("invalid.ip")
if err != nil {
    if eipErr, ok := err.(*ethernetip.EipError); ok {
        fmt.Printf("EIP Error %d: %s\n", eipErr.Code, eipErr.Message)
    } else {
        fmt.Printf("Other error: %v\n", err)
    }
}
```

## Performance Considerations

- The wrapper uses CGO to call into the Rust library, which provides excellent performance
- Connection pooling is handled by the underlying Rust library
- For high-frequency operations, consider using batch operations when available
- Each client connection maintains its own connection to the PLC

## Thread Safety

The Go wrapper is thread-safe. Multiple goroutines can safely use the same client instance concurrently. The underlying Rust library handles synchronization.

## Building and Testing

```bash
# Run tests (note: most tests require actual PLC connection)
go test

# Run only unit tests that don't require PLC
go test -short

# Run benchmarks
go test -bench=.

# Build your application
go build
```

## Examples

See the `examples/` directory for more comprehensive examples including:
- Basic PLC operations
- Web server integration
- React frontend integration
- Batch operations
- Error handling patterns

## Troubleshooting

### Common Issues

1. **CGO linking errors**: Ensure the Rust library is built and in the correct path
2. **Connection timeouts**: Check network connectivity and PLC IP address
3. **Permission errors**: Ensure your application has network access permissions

### Debug Mode

Enable debug logging in your application:
```go
import "log"

// Enable verbose logging
log.SetFlags(log.LstdFlags | log.Lshortfile)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the main project documentation
- Review the examples
- Open an issue on GitHub

## Version History

### v0.4.0
- Initial Go wrapper implementation
- Support for all major PLC data types
- Connection management and health monitoring
- Comprehensive test suite
- Integration with Rust EtherNet/IP library v0.4.0 