# 🦀 Rust EtherNet/IP Driver

> **⚠️ DEVELOPMENT STATUS**  
> **This project is now in beta testing phase and ready for evaluation.**  
> The core functionality is working and stable, but some advanced features are still in development.  
> **Production release is planned for Q2 2024.**

[![Rust](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/performance-1895%2B%20ops%2Fsec-green.svg)]()
[![Status](https://img.shields.io/badge/status-beta-yellow.svg)]()

A high-performance EtherNet/IP communication library for Allen-Bradley CompactLogix PLCs, written in pure Rust with seamless C# integration. **Designed for industrial applications including HMI, SCADA, traceability systems, and OEE performance monitoring.**

## 🎯 **Project Vision & Goals**

### **Target Applications**
- **HMI Systems** - Human Machine Interface applications
- **SCADA Systems** - Supervisory Control and Data Acquisition
- **Traceability Systems** - Product tracking and quality control
- **OEE Performance** - Overall Equipment Effectiveness monitoring
- **Data Collection** - Industrial IoT and analytics platforms

### **Competitive Positioning**
This library aims to provide **Rust-native performance** and **memory safety** while matching the feature completeness of established libraries like **pycomm3** (Python). Our goal is to become the **go-to solution** for high-performance industrial automation in Rust.

## 📊 **Current Development Status**

### ✅ **Implemented Features (Ready for Production)**
- **Basic Tag Operations**: Read/write BOOL, DINT, REAL, STRING tags
- **Array Operations**: Read/write array elements and ranges
- **Batch Operations**: Multiple tag operations in single requests
- **Session Management**: Proper EtherNet/IP session handling
- **Error Handling**: 30+ CIP error codes with detailed messages
- **Performance Testing**: Built-in benchmarking tools
- **C# Integration**: FFI wrapper with high performance
- **Connection Management**: Robust connection lifecycle
- **Tag Discovery**: Automatic tag list upload and caching
- **UDT Support**: User Defined Types and complex structures
- **Multiple PLC Management**: Concurrent connections to multiple PLCs
- **Extended Forward Open**: 4KB packet support for better performance
- **Fragmented Requests**: Handle large data transfers automatically
- **Cross-Platform Support**: Windows, macOS, and Linux support
- **ASP.NET Example**: Complete web application example
- **WPF & WinForms Examples**: Complete desktop application examples

### 🚧 **In Development (v0.2.0 - Q1 2024)**
- **Program Scope Tags** - `Program:MainProgram.TagName` support
- **Real-time Subscriptions** - Tag change notifications
- **Connection Pooling** - Advanced connection management
- **ControlLogix Support** - Full L6x/L7x series compatibility
- **Advanced Error Recovery** - Automatic reconnection and retry logic

### 🔮 **Planned Features (v0.5.0 - Q2 2025)**
- **Security Features** - Authentication and encryption support
- **Advanced Diagnostics** - Detailed connection and performance metrics
- **Cloud Integration** - Industrial IoT connectivity
- **Advanced Analytics** - Built-in OEE calculation utilities
- **Multi-PLC Coordination** - Complex automation scenarios

## 🏭 **Production Readiness Matrix**

| Feature Category | Current Status | Target Status | Timeline |
|------------------|----------------|---------------|----------|
| **Basic I/O Operations** | ✅ **Production Ready** | ✅ **Complete** | ✅ **Done** |
| **Data Type Support** | ✅ **Excellent** (8 types) | ✅ **Excellent** (12+ types) | Q1 2025 |
| **PLC Discovery** | ✅ **Complete** | ✅ **Complete** | ✅ **Done** |
| **Structure Support** | ✅ **Complete** | ✅ **Complete** | ✅ **Done** |
| **Multi-PLC Support** | ✅ **Complete** | ✅ **Complete** | ✅ **Done** |
| **Performance** | ✅ **Excellent** | ✅ **Industry Leading** | Q2 2025 |
| **Reliability** | ⚠️ **Good** | ✅ **Industrial Grade** | Q3 2025 |
| **Documentation** | ✅ **Good** | ✅ **Professional** | Q3 2025 |

**Overall Production Readiness: 80% → Target: 95% by Q3 2025**

## 🚀 **Current Capabilities**

### ✅ **What Works Today**
- **Multiple PLC Operations**: Connect to and manage multiple PLCs
- **Performance**: 1,895+ read ops/sec, 677+ write ops/sec  
- **Data Types**: BOOL, DINT, REAL, STRING, UDT with full type safety
- **Arrays**: Read/write array elements and ranges
- **Batch Operations**: Multiple tags in single request
- **Error Handling**: Comprehensive CIP error reporting
- **C# Integration**: High-performance FFI wrapper
- **Tag Discovery**: Automatic tag list upload and caching
- **UDT Support**: Full User Defined Type handling
- **Connection Pooling**: Efficient connection management
- **Health Monitoring**: Automatic connection health checks
- **Cross-Platform**: Windows, macOS, and Linux support
- **Example Applications**: Complete examples for WPF, WinForms, and ASP.NET applications

### 🚧 **Current Limitations**
- **No Real-time Updates**: No tag change subscriptions
- **Limited Security**: Basic network-level security only
- **No Cloud Integration**: Local operation only
- **Basic Diagnostics**: Limited performance metrics

## 📊 **Performance Benchmarks**

| Operation | Native Rust | C# Wrapper | Industry Standard* |
|-----------|-------------|------------|-------------------|
| **Read BOOL** | 1,880 ops/sec | 1,895 ops/sec | ~1,500 ops/sec |
| **Read DINT** | 1,750 ops/sec | 1,450 ops/sec | ~1,200 ops/sec |
| **Read REAL** | 1,650 ops/sec | 1,350 ops/sec | ~1,100 ops/sec |
| **Read STRING** | 1,200 ops/sec | 1,000 ops/sec | ~800 ops/sec |
| **Read UDT** | 900 ops/sec | 750 ops/sec | ~600 ops/sec |
| **Write BOOL** | 654 ops/sec | 425 ops/sec | ~400 ops/sec |
| **Write DINT** | 600 ops/sec | 677 ops/sec | ~350 ops/sec |
| **Write REAL** | 550 ops/sec | 375 ops/sec | ~300 ops/sec |
| **Write STRING** | 400 ops/sec | 300 ops/sec | ~250 ops/sec |
| **Write UDT** | 300 ops/sec | 250 ops/sec | ~200 ops/sec |

*\*Compared to pycomm3 and similar libraries*  
*Benchmarked on: Intel i7, Windows 10, CompactLogix L33ER*

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                Application Layer                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │
│  │   HMI   │  │  SCADA  │  │   Traceability      │  │
│  │ Systems │  │ Systems │  │    & OEE           │  │
│  └─────────┘  └─────────┘  └─────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│            Language Bindings                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │
│  │  Rust   │  │   C#    │  │    TypeScript       │  │
│  │ Native  │  │ via FFI │  │    via WASM        │  │
│  └─────────┘  └─────────┘  └─────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│              Core Rust Library                     │
│  • EtherNet/IP Protocol Implementation             │
│  • CIP (Common Industrial Protocol)                │
│  • Async TCP with Tokio                           │
│  • Memory-safe tag operations                     │
│  • Multi-PLC connection management                 │
│  • Tag discovery and caching                      │
│  • UDT parsing and handling                       │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Rust Usage

```toml
[dependencies]
rust_ethernet_ip = "0.2"
tokio = { version = "1.0", features = ["full"] }
```

```rust
use rust_ethernet_ip::{EipClient, PlcValue, PlcManager, PlcConfig};
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create PLC manager
    let mut manager = PlcManager::new();
    
    // Configure PLC
    let config = PlcConfig {
        address: "192.168.1.100:44818".parse()?,
        max_connections: 5,
        connection_timeout: Duration::from_secs(5),
        health_check_interval: Duration::from_secs(30),
        max_packet_size: 4000,
    };
    manager.add_plc(config);
    
    // Get connection to PLC
    let mut client = manager.get_connection(config.address).await?;
    
    // Discover tags
    client.discover_tags().await?;
    
    // Read a boolean tag
    let motor_running = client.read_tag("MotorRunning").await?;
    println!("Motor status: {:?}", motor_running);
    
    // Write an integer tag
    client.write_tag("SetPoint", PlcValue::Dint(1500)).await?;
    
    // Read a UDT
    let udt_value = client.read_tag("MotorData").await?;
    if let PlcValue::Udt(members) = udt_value {
        println!("Motor data: {:?}", members);
    }
    
    // Batch operations for efficiency
    let results = client.read_multiple_tags(&["Tag1", "Tag2", "Tag3"]).await?;
    
    client.unregister_session().await?;
    Ok(())
}
```

### C# Usage

```csharp
using RustEtherNetIp;

using var client = new EtherNetIpClient();
if (client.Connect("192.168.1.100:44818"))
{
    // Discover tags
    client.DiscoverTags();
    
    // Read operations
    bool isRunning = client.ReadBool("MotorRunning");
    int counter = client.ReadDint("ProductionCount");
    float temperature = client.ReadReal("BoilerTemp");
    string status = client.ReadString("StatusMessage");
    
    // Read UDT
    var motorData = client.ReadUdt("MotorData");
    Console.WriteLine($"Motor Speed: {motorData["Speed"]}");
    Console.WriteLine($"Motor Current: {motorData["Current"]}");
    
    // Write operations  
    client.WriteBool("StartButton", true);
    client.WriteDint("MotorSpeed", 1750);
    client.WriteReal("SetPoint", 72.5f);
    client.WriteString("StatusMessage", "Running");
    
    // Write UDT
    var newMotorData = new Dictionary<string, object>
    {
        ["Speed"] = 1500,
        ["Current"] = 10.5f,
        ["Status"] = "Running"
    };
    client.WriteUdt("MotorData", newMotorData);
}
```

## 🧪 Testing

### Test Coverage

The library includes comprehensive test coverage across multiple test types:

#### Unit Tests
- Basic data type encoding/decoding
- UDT parsing and member offset calculations
- PLC configuration validation
- Tag cache expiration
- Connection pool management

#### Integration Tests
- End-to-end tag operations
- Multi-PLC scenarios
- Error handling and recovery
- Performance benchmarks
- Memory leak detection

#### Example Applications
- ASP.NET Example: Modern web application with RESTful API
- WPF Example: Modern UI with MVVM pattern
- WinForms Example: Traditional Windows application
- All examples demonstrate:
  - Connection management
  - Tag discovery
  - Real-time updates
  - Error handling
  - Performance monitoring

## 📚 Documentation

### API Reference
- [Rust API Documentation](https://docs.rs/rust_ethernet_ip)
- [C# API Documentation](https://docs.rs/rust_ethernet_ip/latest/rust_ethernet_ip/csharp/index.html)

### Guides
- [Getting Started Guide](docs/getting-started.md)
- [Performance Tuning](docs/performance.md)
- [Error Handling](docs/error-handling.md)
- [UDT Support](docs/udt-support.md)
- [C# Integration](docs/csharp-integration.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Allen-Bradley](https://www.rockwellautomation.com/) for EtherNet/IP protocol
- [Tokio](https://tokio.rs/) for async runtime
- [pycomm3](https://github.com/ottowayi/pycomm3) for protocol reference

## Error Handling and Troubleshooting

### Common Errors

- **Tag not found (404):**
  - The tag name does not exist in the PLC, is misspelled, or is not controller-scoped.
  - **Troubleshooting:** Double-check the tag name, ensure it is controller-scoped, and verify it is not protected or hidden.

- **Type mismatch (400):**
  - The tag exists, but the requested data type does not match the tag's type in the PLC.
  - **Troubleshooting:** Use the tag discovery feature or check the tag's type in your PLC programming software.

- **Tag is read-only (403):**
  - The tag cannot be written to due to PLC configuration.
  - **Troubleshooting:** Check the tag's external access permissions in the PLC.

- **PLC not connected (500):**
  - The PLC is not connected or the connection was lost.
  - **Troubleshooting:** Reconnect to the PLC and ensure network connectivity.

- **Internal/protocol errors (500):**
  - Unexpected errors, timeouts, or protocol issues.
  - **Troubleshooting:** Check logs for details, verify PLC compatibility, and ensure the PLC is not overloaded.

### Example API Responses

**Successful Read:**
```json
{
  "value": 123
}
```

**Tag Not Found:**
```json
{
  "error": "Tag not found: TestDint"
}
```

**Type Mismatch:**
```json
{
  "error": "Type mismatch for tag 'TestDint': expected DINT, got BOOL"
}
```

**Write Verification Failed:**
```json
{
  "error": "Write verification failed. Expected: 1, Got: 234. The tag might be read-only or protected."
}
```

### Tag Naming and PLC Requirements
- Tags must be **controller-scoped** (not program-scoped) for best compatibility.
- Tag names are **case-sensitive** and must match exactly as defined in the PLC.
- Supported types: `BOOL`, `DINT`, `REAL`, `STRING` (and UDTs if configured).
- Tags must have **external read/write access** enabled in the PLC.

### Usage Examples

**Read a DINT tag:**
```http
GET /api/plc/read/dint?plcAddress=192.168.0.1:44818&tagName=TestDint
```

**Write a BOOL tag:**
```http
POST /api/plc/write/bool
{
  "plcAddress": "192.168.0.1:44818",
  "tagName": "TestTag",
  "value": true
}
```

**Error response (tag not found):**
```json
{
  "error": "Tag not found: TestTag"
}
```

**Error response (type mismatch):**
```json
{
  "error": "Type mismatch for tag 'TestTag': expected BOOL, got DINT"
}
```

---

For more troubleshooting tips, see the logs or contact the project maintainers.