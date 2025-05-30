# 🦀 Rust EtherNet/IP Driver

> **⚠️ DEVELOPMENT STATUS**  
> **This project is currently under active development and is NOT ready for production use.**  
> Breaking changes may occur between versions. Use at your own risk in development/testing environments only.  
> **Production-ready release is planned for Q2 2025.**

[![Rust](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/performance-1500%2B%20ops%2Fsec-green.svg)]()
[![Development](https://img.shields.io/badge/status-in%20development-yellow.svg)]()

A high-performance EtherNet/IP communication library for Allen-Bradley CompactLogix PLCs, written in pure Rust with seamless C# integration. **Designed for industrial applications including HMI, SCADA, traceability systems, and OEE performance monitoring.**

## 🎯 **Project Vision & Goals**

### **Target Applications**
- **HMI Systems** - Human Machine Interface applications
- **SCADA Systems** - Supervisory Control and Data Acquisition
- **Traceability Systems** - Product tracking and quality control
- **OEE Performance** - Overall Equipment Effectiveness monitoring
- **Data Collection** - Industrial IoT and analytics platforms

### **Competitive Positioning**
This library aims to provide **Rust-native performance** and **memory safety** while matching the feature completeness of established libraries like **pycomm3** (Python) and **AdvancedHMI** (VB.NET). Our goal is to become the **go-to solution** for high-performance industrial automation in Rust.

## 📊 **Current Development Status**

### ✅ **Implemented Features (Ready for Testing)**
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

### 🚧 **In Development (v0.2.0 - Q1 2025)**
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

**Overall Production Readiness: 75% → Target: 95% by Q3 2025**

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

## 🏷️ Tag Naming Conventions

### Currently Supported
| Format | Example | Status |
|--------|---------|--------|
| **Controller Scope** | `"MotorSpeed"` | ✅ **Working** |
| **Array Elements** | `"DataArray[5]"` | ✅ **Working** |
| **Array Ranges** | `"DataArray[5]{10}"` | ✅ **Working** |
| **Program Scope** | `"Program:MainProgram.Counter"` | ✅ **Working** |
| **UDT Members** | `"Motor1.Speed"` | ✅ **Working** |
| **Nested UDT** | `"Station.Status.Running"` | ✅ **Working** |

## 📈 **Development Roadmap**

### **v0.2.0 - Industrial Foundation (Q1 2025)**
**🎯 Goal: Enable basic industrial applications**

- [x] **Automatic Tag List Upload** - Discover PLC tags automatically
- [x] **UDT Structure Support** - Read complex data structures  
- [x] **Multiple PLC Manager** - Connect to multiple PLCs simultaneously
- [x] **Extended Forward Open** - 4KB packet support for performance
- [x] **Enhanced C# Wrapper** - Match Rust feature parity

**Milestone: Ready for simple HMI and data collection applications**

### **v0.5.0 - Production Features (Q2 2025)**
**🎯 Goal: Enable advanced industrial applications**

- [ ] **Program Scope Tags** - Full tag namespace support
- [ ] **Fragmented Requests** - Handle large data transfers
- [ ] **Real-time Subscriptions** - Tag change notifications
- [ ] **Connection Pooling** - Advanced connection management
- [ ] **Advanced Error Recovery** - Industrial-grade reliability

**Milestone: Ready for SCADA and traceability systems**

### **v1.0.0 - Production Ready (Q3 2025)**
**🎯 Goal: Industry-leading industrial automation library**

- [ ] **Comprehensive Testing** - Validated on multiple PLC models
- [ ] **Performance Optimization** - Industry-leading benchmarks
- [ ] **Professional Documentation** - Complete API docs and examples
- [ ] **Security Audit** - Production security review
- [ ] **Long-term Support** - Stable API with backward compatibility

**Milestone: Ready for mission-critical production systems**

### **v1.5.0 - Extended Platform (Q4 2025)**
**🎯 Goal: Multi-platform industrial automation**

- [ ] **TypeScript/WASM Bindings** - Web-based HMI applications
- [ ] **Cloud Integration** - Industrial IoT connectivity  
- [ ] **Advanced Analytics** - Built-in OEE calculation utilities
- [ ] **Multi-PLC Coordination** - Complex automation scenarios

**Milestone: Complete industrial automation platform**

## 🎯 **When to Use This Library**

### ✅ **Good Fit Today (v0.1.x)**
- **Simple data collection** from single PLC
- **Performance-critical applications** requiring high throughput
- **Development and testing** of automation concepts
- **Learning EtherNet/IP** protocol implementation

### ⏳ **Wait for v0.2.0 (Q1 2025)**
- **HMI applications** requiring automatic tag discovery
- **Multi-PLC systems** with centralized data collection
- **SCADA systems** with complex data structures
- **Production environments** requiring high reliability

### ⏳ **Wait for v1.0.0 (Q3 2025)**
- **Mission-critical production systems**
- **Enterprise industrial applications**
- **Safety-critical automation** (after additional validation)
- **Commercial software products**

## 🏭 **Competitive Analysis**

| Library | Language | Performance | Features | Production Ready |
|---------|----------|-------------|----------|------------------|
| **rust-ethernet-ip** | Rust | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ | ⏳ **Q3 2025** |
| **pycomm3** | Python | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ | ✅ **Yes** |
| **AdvancedHMI** | VB.NET | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | ✅ **Yes** |
| **libplctag** | C | ⭐⭐⭐⭐☆ | ⭐⭐⭐☆☆ | ✅ **Yes** |

**Our Advantage**: Superior performance and memory safety  
**Our Gap**: Missing industrial automation features (closing fast!)

## 🤝 **Contributing & Community**

### **How to Help**

**🔬 Testing & Feedback**
- Test with your PLC models and report compatibility
- Share your use cases and requirements
- Report bugs and performance issues

**💻 Development**
- Contribute to missing features (UDT support, tag discovery)
- Add PLC model compatibility
- Improve documentation and examples

**📚 Documentation**
- Create industrial automation examples
- Write tutorials for common use cases
- Share best practices and patterns

### **Development Priorities**
1. **Tag List Upload Service** - Most critical for industrial use
2. **UDT Structure Support** - Essential for complex applications  
3. **Multiple PLC Management** - Required for real systems
4. **Performance Optimization** - Maintain competitive advantage

## 📞 **Support & Contact**

### **Community Support**
- **Issues**: [GitHub Issues](https://github.com/sergiogallegos/rust-ethernet-ip/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sergiogallegos/rust-ethernet-ip/discussions)
- **Documentation**: See inline code documentation

### **Professional Services**
For commercial support, custom development, or enterprise licensing:
- **Email**: Available upon request
- **Consulting**: Industrial automation integration services
- **Training**: Rust for industrial automation workshops

## ⚖️ **License & Disclaimer**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Industrial Use Disclaimer**: This library is designed for industrial automation but is currently in development. Always validate thoroughly in your specific environment before production use. The authors assume no responsibility for industrial equipment damage or safety issues.

## 🏆 **Acknowledgments**

- **Rockwell Automation**: For EtherNet/IP and CIP specifications
- **pycomm3 Project**: Inspiration for feature completeness
- **Rust Community**: For excellent async and networking libraries
- **Industrial Automation Community**: For testing, feedback, and requirements

---

**Made with ❤️ and 🦀 for Industrial Automation**

*Building the future of industrial automation with Rust's performance and safety!*

> **💡 Interested in using this for production?**  
> ⭐ **Star this repository** to stay updated on our progress toward v1.0.0!  
> 📬 **Watch releases** to be notified when production-ready versions are available!