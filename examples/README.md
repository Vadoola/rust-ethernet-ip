# 🚀 Rust EtherNet/IP Examples

This directory contains comprehensive examples demonstrating the Rust EtherNet/IP library across multiple platforms and languages.

## 📁 **Directory Structure**

```
examples/
├── rust_examples/           # Native Rust examples
├── csharp_examples/         # C# test examples  
├── AspNetExample/           # ASP.NET Core Web API
├── TypeScriptExample/       # TypeScript + React dashboard
├── VueExample/              # Vue.js 3 + TypeScript frontend
├── WpfExample/              # WPF desktop application
├── WinFormsExample/         # WinForms desktop application
├── gonextjs/                # Go + Next.js fullstack example
├── PLC_Monitor_Dashboard/   # Python + React dashboard
└── CSharpFFITest/          # C# FFI integration test
```

## 🦀 **Rust Examples** (`rust_examples/`)

### **Core Functionality**
- **`advanced_tag_addressing.rs`** - Complex tag path parsing and addressing
- **`data_types_showcase.rs`** - All 13 Allen-Bradley data types demonstration
- **`batch_operations_demo.rs`** - High-performance batch operations
- **`connection_test.rs`** - Basic connection and session management

### **UDT (User Defined Type) Examples**
- **`enhanced_udt_demo.rs`** - Enhanced UDT parsing with multiple members
- **`generic_udt_demo.rs`** - Generic UDT handling
- **`udt_discovery_demo.rs`** - UDT structure discovery
- **`test_udt_multiple_members.rs`** - Multi-member UDT parsing
- **`test_udt_chunked.rs`** - Chunked UDT reading for large structures

### **Program Tag Examples**
- **`test_program_tag_out_fuse.rs`** - Program-scoped tag access
- **`test_program_exists.rs`** - Program existence checking

### **Performance Examples**
- **`batch_benchmark.rs`** - Performance benchmarking
- **`tag_operations.rs`** - Tag operation patterns
- **`simple_tag_test.rs`** - Basic tag operations

### **String Handling**
- **`test_complete_string_demo.rs`** - Complete string operations
- **`test_string_direct.rs`** - Direct string access
- **`test_string_write_debug.rs`** - String writing with debugging

### **Tag Discovery**
- **`test_improved_tag_discovery.rs`** - Enhanced tag discovery
- **`test_tag_discovery_fix.rs`** - Tag discovery fixes
- **`test_tag_discovery.rs`** - Basic tag discovery

### **UDT Testing**
- **`test_gtracking_udt.rs`** - gTracking UDT testing
- **`test_part_data_*.rs`** - Part_Data UDT testing (multiple approaches)
- **`test_real_udt.rs`** - Real UDT testing

## 🖥️ **Desktop Applications**

### **WPF Application** (`WpfExample/`)
Modern WPF desktop application with MVVM architecture:
```bash
cd examples/WpfExample
dotnet run
```

**Features:**
- ✅ MVVM architecture with CommunityToolkit.Mvvm
- ✅ Real-time tag monitoring with automatic refresh
- ✅ Advanced tag discovery with type detection
- ✅ Performance benchmarking with visual metrics
- ✅ Comprehensive logging with timestamped activity

### **WinForms Application** (`WinFormsExample/`)
Traditional Windows Forms application:
```bash
cd examples/WinFormsExample
dotnet run
```

**Features:**
- ✅ Classic Windows UI with familiar controls
- ✅ Connection monitoring with automatic reconnection
- ✅ Tag operations with validation and error handling
- ✅ Performance testing with real-time metrics
- ✅ Industrial styling with professional appearance

## 🌐 **Web Applications**

### **ASP.NET Core Web API** (`AspNetExample/`)
RESTful API backend providing HTTP access to PLC functionality:
```bash
cd examples/AspNetExample
dotnet run
```

**Features:**
- ✅ RESTful endpoints for all PLC operations
- ✅ Swagger documentation with interactive API explorer
- ✅ Type-safe operations with comprehensive validation
- ✅ Performance monitoring with built-in benchmarking
- ✅ Production-ready with proper error handling and logging

### **TypeScript + React Dashboard** (`TypeScriptExample/`)
Modern web-based PLC dashboard:
```bash
# Start backend API
cd examples/AspNetExample
dotnet run

# Start frontend (new terminal)
cd examples/TypeScriptExample/frontend
npm install && npm run dev
```

**Features:**
- ✅ Modern UI/UX with glassmorphism design and responsive layout
- ✅ Real-time monitoring with live tag updates and performance metrics
- ✅ Complete data type support for all 13 Allen-Bradley types
- ✅ Advanced tag addressing with interactive examples
- ✅ Type-safe API with comprehensive TypeScript interfaces
- ✅ Professional features including benchmarking and activity logging

### **Vue.js 3 + TypeScript Frontend** (`VueExample/`)
Modern Vue.js 3 frontend with TypeScript:
```bash
# Start backend API
cd examples/AspNetExample
dotnet run

# Start Vue.js frontend (new terminal)
cd examples/VueExample
npm install && npm run dev
```

**Features:**
- ✅ Vue.js 3 with Composition API and TypeScript
- ✅ Tailwind CSS for modern, responsive design
- ✅ Pinia state management for application state
- ✅ Backend detection system for automatic ASP.NET Core port discovery
- ✅ Component-based architecture with reusable UI components
- ✅ Real-time connection monitoring with PLC status display

### **Go + Next.js Fullstack** (`gonextjs/`)
Modern fullstack demo with Go backend and Next.js frontend:
```bash
# Start backend
cd examples/gonextjs/backend
go run .

# Start frontend (new terminal)
cd examples/gonextjs/frontend
npm install && npm run dev
```

**Features:**
- ✅ Go backend using the Rust EtherNet/IP Go wrapper (FFI)
- ✅ Next.js frontend (TypeScript, Tailwind, App Router)
- ✅ Batch read/write and individual tag operations
- ✅ Performance benchmarking (ops/sec, latency)
- ✅ Real-time tag updates via WebSocket
- ✅ Comprehensive PLC data type support
- ✅ Modern, responsive UI
- ✅ Professional HMI/SCADA Demo with OEE analysis

### **Python + React Dashboard** (`PLC_Monitor_Dashboard/`)
Python backend with React frontend:
```bash
cd examples/PLC_Monitor_Dashboard
# Follow README.md for setup instructions
```

**Features:**
- ✅ Python backend with FastAPI
- ✅ React frontend with modern UI
- ✅ Real-time PLC monitoring
- ✅ Docker containerization
- ✅ Production-ready deployment

## 🧪 **C# Test Examples** (`csharp_examples/`)

### **UDT Testing**
- **`TestUdtDirect.cs`** - Direct UDT testing
- **`TestUdtMember/`** - UDT member testing
- **`TestUdtParsing/`** - UDT parsing testing
- **`TestUdtSimple/`** - Simple UDT testing

### **Part Data Testing**
- **`Part_Data_Test/`** - Part_Data UDT testing
- **`Part_Data_UDT_Test.cs`** - Part_Data UDT test

## 🚀 **Quick Start Guide**

### **1. Choose Your Platform:**
- **Web/Modern UI** → TypeScript + React Dashboard or Vue.js 3 + TypeScript
- **Desktop/Windows** → WPF or WinForms Application  
- **Web API/Services** → ASP.NET Core Web API
- **Native/Performance** → Rust Examples
- **Fullstack/Modern** → Go + Next.js

### **2. Start the Backend** (for web examples):
```bash
cd examples/AspNetExample
dotnet run
```

### **3. Run Your Chosen Example:**
```bash
# Rust examples
cargo run --example advanced_tag_addressing
cargo run --example data_types_showcase
cargo run --example batch_operations_demo

# Desktop applications
cd examples/WpfExample && dotnet run
cd examples/WinFormsExample && dotnet run

# Web applications
cd examples/TypeScriptExample/frontend && npm install && npm run dev
cd examples/VueExample && npm install && npm run dev
cd examples/gonextjs/frontend && npm install && npm run dev
```

### **4. Connect to Your PLC:**
All examples connect to PLC at `192.168.0.1:44818` by default. Modify the IP address in the examples as needed.

## 📊 **Example Features by Category**

| Category | Rust | C# | Web | Desktop | Fullstack |
|----------|------|----|----|---------|-----------|
| **Basic Operations** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Advanced Tag Addressing** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **UDT Support** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Program Tags** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Batch Operations** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Real-time Monitoring** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Performance Testing** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Error Handling** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modern UI** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Cross-platform** | ✅ | ✅ | ✅ | ❌ | ✅ |

## 🔧 **Development Setup**

### **Prerequisites:**
- **Rust**: Latest stable version
- **.NET**: 6.0 or later
- **Node.js**: 16.0 or later
- **Go**: 1.19 or later (for Go examples)
- **Python**: 3.8 or later (for Python examples)

### **Build All Examples:**
```bash
# Build everything
./build-all.bat

# Or build specific components
cargo build --release                    # Rust library
cd examples/AspNetExample && dotnet build  # C# backend
cd examples/TypeScriptExample/frontend && npm install  # React frontend
cd examples/VueExample && npm install     # Vue frontend
cd examples/gonextjs/backend && go build  # Go backend
cd examples/gonextjs/frontend && npm install  # Next.js frontend
```

## 📚 **Documentation**

Each example includes comprehensive documentation:
- **Setup instructions** for each platform
- **Configuration options** and customization
- **API documentation** with examples
- **Troubleshooting guides** for common issues
- **Performance optimization** tips

## 🤝 **Contributing**

To add new examples:
1. Follow the existing directory structure
2. Include comprehensive README.md
3. Add proper error handling and logging
4. Test across different PLC configurations
5. Update this main README.md

## 🎯 **Best Practices**

- **Use connection pooling** for high-frequency operations
- **Implement proper error handling** with user-friendly messages
- **Add performance monitoring** for production applications
- **Use batch operations** for multiple tag reads/writes
- **Implement retry logic** for network resilience
- **Add comprehensive logging** for debugging and monitoring

---

**Built with ❤️ for the industrial automation community**
