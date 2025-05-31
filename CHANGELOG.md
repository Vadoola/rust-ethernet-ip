# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Program Scope Tags - `Program:MainProgram.TagName` support
- Real-time Subscriptions - Tag change notifications
- Connection Pooling - Advanced connection management
- ControlLogix Support - Full L6x/L7x series compatibility
- Advanced Error Recovery - Automatic reconnection and retry logic

## [0.2.0] - 2025-01-15

### Added
- Enhanced C# FFI wrapper with improved performance
- Comprehensive documentation and examples
- WinForms, WPF, and ASP.NET example applications
- Advanced tag discovery and caching system
- Multi-PLC connection management
- Extended Forward Open with 4KB packet support
- Fragmented request handling for large data transfers
- Cross-platform support (Windows, macOS, Linux)
- UDT (User Defined Types) support
- Batch operations for multiple tag operations
- Connection health monitoring
- Comprehensive error handling with 30+ CIP error codes

### Performance
- 1,895+ read operations per second
- 677+ write operations per second
- Benchmarked on CompactLogix L33ER
- Memory-safe operations with zero-copy optimizations

### Fixed
- Improved connection stability
- Better error handling and recovery
- Memory leak fixes in FFI layer
- Thread safety improvements

## [0.1.0] - 2025-01-01

### Added
- Initial release of Rust EtherNet/IP driver
- Core EtherNet/IP protocol implementation
- CompactLogix PLC support (L1x-L5x series)
- Support for BOOL, DINT, REAL, STRING data types
- Async I/O with Tokio
- Memory-safe tag operations
- Basic C# FFI wrapper
- Cross-platform compatibility