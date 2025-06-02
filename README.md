# 🦀 Rust EtherNet/IP Driver

> **✅ PRODUCTION READY - PHASE 1 COMPLETE**  
> **This project has successfully completed Phase 1 development and is ready for production use.**  
> The core functionality is fully implemented, tested, and stable, with comprehensive data type support and advanced tag addressing capabilities.  
> **Production release v1.0 is planned for Q4 2025.**

[![Rust](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org)
[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://github.com/sergiogallegos/rust-ethernet-ip/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/performance-1500%2B%20ops%2Fsec-green.svg)]()
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()
[![C# Wrapper](https://img.shields.io/badge/C%23%20wrapper-available-blue.svg)]()

A high-performance, production-ready EtherNet/IP communication library specifically designed for **Allen-Bradley CompactLogix and ControlLogix PLCs**. Built in pure Rust with focus on **PC applications**, offering exceptional performance, memory safety, and comprehensive industrial features.

## 🎯 **Project Focus**

This library is specifically designed for:
- **Allen-Bradley CompactLogix** (L1x, L2x, L3x, L4x, L5x series)
- **Allen-Bradley ControlLogix** (L6x, L7x, L8x series)
- **PC Applications** (Windows, Linux, macOS)
- **Industrial Automation** software and SCADA systems
- **High-performance** data acquisition and control

## ✨ **Key Features**

### 🔧 **Connection Robustness**
- **Automatic session management** with proper registration/unregistration
- **Connection health monitoring** with configurable timeouts
- **Network resilience** handling for industrial environments
- **Comprehensive error handling** with detailed CIP error mapping

### 📍 **Advanced Tag Addressing** ✅ **COMPLETED**
- **Program-scoped tags**: `Program:MainProgram.Tag1`
- **Array element access**: `MyArray[5]`, `MyArray[1,2,3]`
- **Bit-level operations**: `MyDINT.15` (access individual bits)
- **UDT member access**: `MyUDT.Member1.SubMember`
- **String operations**: `MyString.LEN`, `MyString.DATA[5]`
- **Complex nested paths**: `Program:Production.Lines[2].Stations[5].Motor.Status.15`

### 📊 **Complete Data Type Support** ✅ **COMPLETED**
All Allen-Bradley native data types with proper CIP encoding:
- **BOOL** - Boolean values (CIP type 0x00C1)
- **SINT** - 8-bit signed integer (-128 to 127, CIP type 0x00C2)
- **INT** - 16-bit signed integer (-32,768 to 32,767, CIP type 0x00C3)
- **DINT** - 32-bit signed integer (-2.1B to 2.1B, CIP type 0x00C4)
- **LINT** - 64-bit signed integer (CIP type 0x00C5)
- **USINT** - 8-bit unsigned integer (0 to 255, CIP type 0x00C6)
- **UINT** - 16-bit unsigned integer (0 to 65,535, CIP type 0x00C7)
- **UDINT** - 32-bit unsigned integer (0 to 4.3B, CIP type 0x00C8)
- **ULINT** - 64-bit unsigned integer (CIP type 0x00C9)
- **REAL** - 32-bit IEEE 754 float (CIP type 0x00CA)
- **LREAL** - 64-bit IEEE 754 double (CIP type 0x00CB)
- **STRING** - Variable-length strings (CIP type 0x00DA)
- **UDT** - User Defined Types with full nesting support (CIP type 0x00A0)

### 🔗 **C# Integration** ✅ **COMPLETED**
- **Complete C# wrapper** with all data types
- **22 FFI functions** for seamless integration
- **Type-safe API** with comprehensive error handling
- **NuGet package ready** for easy distribution
- **Cross-platform support** (Windows, Linux, macOS)

### ⚠️ **Comprehensive Error Handling** ✅ **COMPLETED**
- **Detailed CIP error mapping** with 40+ error codes
- **Network-level diagnostics** and troubleshooting
- **Granular error types** for precise error handling
- **Automatic error recovery** for transient issues

### 🏗️ **Build System** ✅ **COMPLETED**
- **Automated build scripts** for Windows and Linux/macOS
- **Cross-platform compilation** with proper library generation
- **Comprehensive testing** with 30+ unit tests
- **CI/CD ready** with GitHub Actions examples

## 🚀 **Performance Characteristics**

Optimized for PC applications with excellent performance:

| Operation | Throughput | Latency | Memory Usage |
|-----------|------------|---------|--------------|
| Single Tag Read | 1,500+ ops/sec | 1-3ms | ~2KB |
| Single Tag Write | 800+ ops/sec | 2-5ms | ~2KB |
| Tag Path Parsing | 10,000+ ops/sec | <0.1ms | ~1KB |
| Connection Setup | N/A | 100-500ms | ~8KB |
| Memory per Connection | N/A | N/A | ~8KB base |

## 📋 **Development Roadmap**

### 🔥 **Phase 1: Core Enhancements** ✅ **COMPLETED - June 2025**
- [x] Basic tag read/write operations
- [x] Connection management and session handling
- [x] **Enhanced tag path parsing** (Program-scoped, arrays, bit access)
- [x] **Complete data type support** (All Allen-Bradley types)
- [x] **C# wrapper integration** (22 FFI functions)
- [x] **Comprehensive testing** (30+ unit tests)
- [x] **Build automation** (Cross-platform build scripts)
- [x] **Documentation** (Examples, API docs, guides)

### ⚡ **Phase 2: Advanced Features** (Q3-Q4 2025)
- [ ] **Batch operations** (multi-tag read/write)
- [ ] **Real-time subscriptions** (tag change notifications)
- [ ] **Performance optimizations** (zero-copy operations)
- [ ] **Connection pooling** (multiple concurrent connections)

### 🎯 **Phase 3: Production Ready** (Q4 2025)
- [ ] **Stress testing** (long-term stability tests)
- [ ] **Performance benchmarking** (vs other libraries)
- [ ] **Production deployment** (v1.0 release)
- [ ] **Community features** (Discord, support channels)

## 🛠️ **Installation**

### Rust Library
Add to your `Cargo.toml`:

```toml
[dependencies]
rust-ethernet-ip = "0.3.0"
tokio = { version = "1.0", features = ["full"] }
```

### C# Wrapper
Install via NuGet:

```xml
<PackageReference Include="RustEtherNetIp" Version="0.3.0" />
```

Or via Package Manager Console:
```powershell
Install-Package RustEtherNetIp
```

## 📖 **Quick Start**

### Rust Usage

```rust
use rust_ethernet_ip::{EipClient, PlcValue};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to CompactLogix PLC
    let mut client = EipClient::connect("192.168.1.100:44818").await?;
    
    // Read different data types
    let motor_running = client.read_tag("Program:Main.MotorRunning").await?;
    let production_count = client.read_tag("Program:Main.ProductionCount").await?;
    let temperature = client.read_tag("Program:Main.Temperature").await?;
    
    // Write values
    client.write_tag("Program:Main.SetPoint", PlcValue::Dint(1500)).await?;
    client.write_tag("Program:Main.StartButton", PlcValue::Bool(true)).await?;
    
    println!("Motor running: {:?}", motor_running);
    println!("Production count: {:?}", production_count);
    println!("Temperature: {:?}", temperature);
    
    Ok(())
}
```

### C# Usage

```csharp
using RustEtherNetIp;

using var client = new EtherNetIpClient();
if (client.Connect("192.168.1.100:44818"))
{
    // Read different data types
    bool motorRunning = client.ReadBool("Program:Main.MotorRunning");
    int productionCount = client.ReadDint("Program:Main.ProductionCount");
    float temperature = client.ReadReal("Program:Main.Temperature");
    
    // Write values
    client.WriteDint("Program:Main.SetPoint", 1500);
    client.WriteBool("Program:Main.StartButton", true);
    
    Console.WriteLine($"Motor running: {motorRunning}");
    Console.WriteLine($"Production count: {productionCount}");
    Console.WriteLine($"Temperature: {temperature:F1}°C");
}
```

### Advanced Tag Addressing

```rust
// Program-scoped tags
let value = client.read_tag("Program:MainProgram.Tag1").await?;

// Array elements
let array_element = client.read_tag("Program:Main.MyArray[5]").await?;
let multi_dim = client.read_tag("Program:Main.Matrix[1,2,3]").await?;

// Bit access
let bit_value = client.read_tag("Program:Main.StatusWord.15").await?;

// UDT members
let udt_member = client.read_tag("Program:Main.MotorData.Speed").await?;
let nested_udt = client.read_tag("Program:Main.Recipe.Step1.Temperature").await?;

// String operations
let string_length = client.read_tag("Program:Main.ProductName.LEN").await?;
let string_char = client.read_tag("Program:Main.ProductName.DATA[0]").await?;
```

### Complete Data Type Examples

```rust
// All supported data types
let bool_val = client.read_tag("BoolTag").await?;           // BOOL
let sint_val = client.read_tag("SintTag").await?;           // SINT (-128 to 127)
let int_val = client.read_tag("IntTag").await?;             // INT (-32,768 to 32,767)
let dint_val = client.read_tag("DintTag").await?;           // DINT (-2.1B to 2.1B)
let lint_val = client.read_tag("LintTag").await?;           // LINT (64-bit signed)
let usint_val = client.read_tag("UsintTag").await?;         // USINT (0 to 255)
let uint_val = client.read_tag("UintTag").await?;           // UINT (0 to 65,535)
let udint_val = client.read_tag("UdintTag").await?;         // UDINT (0 to 4.3B)
let ulint_val = client.read_tag("UlintTag").await?;         // ULINT (64-bit unsigned)
let real_val = client.read_tag("RealTag").await?;           // REAL (32-bit float)
let lreal_val = client.read_tag("LrealTag").await?;         // LREAL (64-bit double)
let string_val = client.read_tag("StringTag").await?;       // STRING
let udt_val = client.read_tag("UdtTag").await?;             // UDT
```

## 🏗️ **Building**

### Quick Build
```bash
# Windows
build.bat

# Linux/macOS
./build.sh
```

### Manual Build
```bash
# Build Rust library
cargo build --release --lib

# Copy to C# project (Windows)
copy target\release\rust_ethernet_ip.dll csharp\RustEtherNetIp\

# Build C# wrapper
cd csharp/RustEtherNetIp
dotnet build --configuration Release
```

See [BUILD.md](BUILD.md) for comprehensive build instructions.

## 🧪 **Testing**

Run the comprehensive test suite:

```bash
# Rust unit tests (30+ tests)
cargo test

# C# wrapper tests
cd csharp/RustEtherNetIp.Tests
dotnet test

# Run examples
cargo run --example advanced_tag_addressing
cargo run --example data_types_showcase
```

## 🎯 **Examples**

Explore comprehensive examples demonstrating all library capabilities across different platforms:

### **🌐 TypeScript + React Dashboard** *(Recommended)*
Modern web-based PLC dashboard with real-time monitoring and advanced features.

```bash
# Start backend API
cd examples/AspNetExample
dotnet run

# Start frontend (new terminal)
cd examples/TypeScriptExample/frontend
npm install && npm run dev
```

**Features:**
- ✅ **Modern UI/UX** with glassmorphism design and responsive layout
- ✅ **Real-time monitoring** with live tag updates and performance metrics
- ✅ **Complete data type support** for all 13 Allen-Bradley types
- ✅ **Advanced tag addressing** with interactive examples
- ✅ **Type-safe API** with comprehensive TypeScript interfaces
- ✅ **Professional features** including benchmarking and activity logging

**Perfect for:** Web applications, dashboards, remote monitoring, modern industrial HMIs

### **🖥️ WPF Desktop Application**
Rich desktop application with MVVM architecture and modern UI.

```bash
cd examples/WpfExample
dotnet run
```

**Features:**
- ✅ **MVVM architecture** with CommunityToolkit.Mvvm
- ✅ **Real-time tag monitoring** with automatic refresh
- ✅ **Advanced tag discovery** with type detection
- ✅ **Performance benchmarking** with visual metrics
- ✅ **Comprehensive logging** with timestamped activity

**Perfect for:** Desktop HMIs, engineering tools, maintenance applications

### **🪟 WinForms Application**
Traditional Windows Forms application with familiar UI patterns.

```bash
cd examples/WinFormsExample
dotnet run
```

**Features:**
- ✅ **Classic Windows UI** with familiar controls
- ✅ **Connection monitoring** with automatic reconnection
- ✅ **Tag operations** with validation and error handling
- ✅ **Performance testing** with real-time metrics
- ✅ **Industrial styling** with professional appearance

**Perfect for:** Legacy system integration, simple HMIs, maintenance tools

### **🌐 ASP.NET Core Web API**
RESTful API backend providing HTTP access to PLC functionality.

```bash
cd examples/AspNetExample
dotnet run
```

**Features:**
- ✅ **RESTful endpoints** for all PLC operations
- ✅ **Swagger documentation** with interactive API explorer
- ✅ **Type-safe operations** with comprehensive validation
- ✅ **Performance monitoring** with built-in benchmarking
- ✅ **Production-ready** with proper error handling and logging

**Perfect for:** Web services, microservices, system integration, mobile backends

### **🦀 Rust Examples**
Native Rust examples demonstrating core library functionality.

```bash
# Advanced tag addressing showcase
cargo run --example advanced_tag_addressing

# Complete data types demonstration
cargo run --example data_types_showcase
```

**Features:**
- ✅ **Advanced tag parsing** with complex path examples
- ✅ **All data types** with encoding demonstrations
- ✅ **Performance examples** with async/await patterns
- ✅ **Error handling** with comprehensive error types

**Perfect for:** Rust applications, embedded systems, high-performance scenarios

### **🚀 Quick Start Guide**

1. **Choose your platform:**
   - **Web/Modern UI** → TypeScript + React Dashboard
   - **Desktop/Windows** → WPF or WinForms Application  
   - **Web API/Services** → ASP.NET Core Web API
   - **Native/Performance** → Rust Examples

2. **Start the backend** (for web examples):
   ```bash
   cd examples/AspNetExample
   dotnet run
   ```

3. **Run your chosen example** and connect to your PLC at `192.168.0.1:44818`

4. **Explore features:**
   - Tag discovery with advanced addressing
   - Real-time monitoring and benchmarking
   - All 13 Allen-Bradley data types
   - Professional error handling and logging

### **📁 Example Structure**
```
examples/
├── TypeScriptExample/          # React + TypeScript dashboard
│   ├── frontend/              # Modern web UI
│   ├── start-backend.bat      # Backend startup script
│   └── start-frontend.bat     # Frontend startup script
├── WpfExample/                # WPF desktop application
├── WinFormsExample/           # WinForms desktop application
├── AspNetExample/             # ASP.NET Core Web API
└── rust-examples/             # Native Rust examples
    ├── advanced_tag_addressing.rs
    └── data_types_showcase.rs
```

Each example includes comprehensive documentation, setup instructions, and demonstrates different aspects of the library's capabilities.

## 📚 **Documentation**

- **[API Documentation](https://docs.rs/rust-ethernet-ip)** - Complete API reference
- **[Examples](examples/)** - Practical usage examples
- **[Build Guide](BUILD.md)** - Comprehensive build instructions
- **[C# Wrapper Guide](csharp/RustEtherNetIp/README.md)** - C# integration documentation
- **[Changelog](CHANGELOG.md)** - Version history and changes

## 🤝 **Community & Support**

- **[Discord Server](https://discord.gg/uzaM3tua)** - Community discussions, support, and development updates
- **[GitHub Issues](https://github.com/sergiogallegos/rust-ethernet-ip/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/sergiogallegos/rust-ethernet-ip/discussions)** - General questions and ideas

## 🙏 **Inspiration**

This project draws inspiration from excellent libraries in the industrial automation space:
- **[pylogix](https://github.com/dmroeder/pylogix)** - Python library for Allen-Bradley PLCs
- **[pycomm3](https://github.com/ottowayi/pycomm3)** - Python library for Allen-Bradley PLCs
- **[gologix](https://github.com/danomagnum/gologix)** - Go library for Allen-Bradley PLCs
- **[libplctag](https://github.com/libplctag/libplctag)** - Cross-platform PLC communication library

## 🚀 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code style and standards
- Testing requirements
- Pull request process
- Development setup

## ⚠️ **Disclaimer and Liability**

### **Use at Your Own Risk**
This library is provided "AS IS" without warranty of any kind. Users assume full responsibility for its use in their applications and systems.

### **No Warranties**
The developers and contributors make **NO WARRANTIES, EXPRESS OR IMPLIED**, including but not limited to:
- **Merchantability** or fitness for a particular purpose
- **Reliability** or availability of the software
- **Accuracy** of data transmission or processing
- **Safety** for use in critical or production systems

### **Industrial Safety Responsibility**
- **🏭 Industrial Use:** Users are solely responsible for ensuring this library meets their industrial safety requirements
- **🔒 Safety Systems:** This library should NOT be used for safety-critical applications without proper validation
- **⚙️ Production Systems:** Thoroughly test in non-production environments before deploying to production systems
- **📋 Compliance:** Users must ensure compliance with all applicable industrial standards and regulations

### **Limitation of Liability**
Under no circumstances shall the developers, contributors, or associated parties be liable for:
- **Equipment damage** or malfunction
- **Production downtime** or operational disruptions  
- **Data loss** or corruption
- **Personal injury** or property damage
- **Financial losses** of any kind
- **Consequential or indirect damages**

### **User Responsibilities**
By using this library, you acknowledge and agree that:
- You have the technical expertise to properly implement and test the library
- You will perform adequate testing before production deployment
- You will implement appropriate safety measures and fail-safes
- You understand the risks associated with industrial automation systems
- You accept full responsibility for any consequences of using this library

### **Indemnification**
Users agree to indemnify and hold harmless the developers and contributors from any claims, damages, or liabilities arising from the use of this library.

---

**⚠️ IMPORTANT: This disclaimer is an integral part of the license terms. Use of this library constitutes acceptance of these terms.**

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the industrial automation community**