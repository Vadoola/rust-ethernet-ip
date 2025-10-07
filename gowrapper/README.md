# Go EtherNet/IP Wrapper

This directory contains the Go wrapper for the Rust EtherNet/IP library, providing a high-level Go API for communicating with Allen-Bradley PLCs.

## Features

- **Complete EtherNet/IP Support**: Read/write all standard PLC data types
- **UDT Support**: Full support for User Defined Types with chunked reading
- **Template System**: Generic UDT template parsing for any UDT structure
- **Batch Operations**: Efficient batch read/write operations
- **Error Handling**: Comprehensive error handling with detailed error information
- **Connection Management**: Automatic connection management with keep-alive
- **Async Operations**: Support for asynchronous tag operations

## Installation

```bash
go mod tidy
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    "github.com/sergiogallegos/rust-ethernet-ip/gowrapper/ethernetip"
)

func main() {
    // Connect to PLC
    client, err := ethernetip.NewClient("192.168.0.1:44818")
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Read a boolean tag
    value, err := client.ReadBool("TestTag")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("TestTag: %v\n", value)

    // Read a UDT
    udt, err := client.ReadUdt("Part_Data")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Part_Data UDT: %+v\n", udt)
}
```

## UDT Support

The Go wrapper provides comprehensive UDT support with template-based parsing:

### Basic UDT Reading

```go
// Read entire UDT
udt, err := client.ReadUdt("Part_Data")
if err != nil {
    log.Fatal(err)
}

// Access individual members
for key, value := range udt.Members {
    fmt.Printf("%s: %v\n", key, value)
}
```

### Template-Based Parsing

```go
// Create a template for your UDT
template := &ethernetip.UdtTemplate{
    Name: "Part_Data",
    TotalSize: 2,
    Members: []ethernetip.UdtMemberTemplate{
        {Name: "oMachine_Running", DataType: "bool", Size: 1, Offset: 0, BitOffset: 0},
        {Name: "oAlarm_Active", DataType: "bool", Size: 1, Offset: 0, BitOffset: 1},
        // ... more members
    },
}

// Parse UDT with template
parsedUdt, err := client.ParseUdtWithTemplate("Part_Data", template)
if err != nil {
    log.Fatal(err)
}
```

### UDT Member Operations

```go
// Get specific UDT member
member, err := client.GetUdtMember("Part_Data", "oMachine_Running")
if err != nil {
    log.Fatal(err)
}

// Write specific UDT member
err = client.WriteUdtMember("Part_Data", "oMachine_Running", true)
if err != nil {
    log.Fatal(err)
}
```

## Data Types

The wrapper supports all standard PLC data types:

- `Bool` - Boolean values
- `Sint` - 8-bit signed integer
- `Int` - 16-bit signed integer  
- `Dint` - 32-bit signed integer
- `Lint` - 64-bit signed integer
- `Real` - 32-bit floating point
- `Lreal` - 64-bit floating point
- `String` - String values
- `Udt` - User Defined Types

## Batch Operations

```go
// Batch read multiple tags
tagNames := []string{"Tag1", "Tag2", "Tag3"}
results, err := client.BatchRead(tagNames)
if err != nil {
    log.Fatal(err)
}

// Batch write multiple tags
tagValues := map[string]interface{}{
    "Tag1": true,
    "Tag2": 42,
    "Tag3": "Hello",
}
err = client.BatchWrite(tagValues)
if err != nil {
    log.Fatal(err)
}
```

## Error Handling

The wrapper provides detailed error information:

```go
client, err := ethernetip.NewClient("192.168.0.1:44818")
if err != nil {
    if eipErr, ok := err.(*ethernetip.EipError); ok {
        fmt.Printf("Error Code: %d\n", eipErr.Code)
        fmt.Printf("Error Message: %s\n", eipErr.Message)
        fmt.Printf("Error Details: %+v\n", eipErr.Details)
    }
}
```

## Examples

See the `examples/` directory for complete examples:

- `test_udt_go.go` - Basic UDT functionality test
- `part_data_template.go` - Demo-specific UDT template for Part_Data

## Building

The Go wrapper requires the Rust library to be built first:

```bash
# Build the Rust library
cd ..
cargo build --release

# Copy the DLL to the Go wrapper directory
cp target/release/rust_ethernet_ip.dll gowrapper/

# Build Go examples
cd gowrapper
go build examples/test_udt_go.go
```

## Requirements

- Go 1.23 or later
- Rust library built and available
- Windows (for now, Linux support coming soon)

## License

Same as the main Rust EtherNet/IP library.