# Contributing to Rust EtherNet/IP Driver

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `cargo test`
6. Check code formatting: `cargo fmt`
7. Run clippy: `cargo clippy`
8. Commit your changes: `git commit -m 'Add amazing feature'`
9. Push to your branch: `git push origin feature/amazing-feature`
10. Open a Pull Request

## 🧪 Testing

- Write tests for new functionality
- Ensure existing tests continue to pass
- Test with real PLCs when possible
- Document any PLC-specific requirements

## 📝 Code Style

- Follow standard Rust formatting (`cargo fmt`)
- Use meaningful variable and function names
- Add documentation comments for public APIs
- Keep functions focused and concise

## 🐛 Bug Reports

Please use the issue tracker to report bugs. Include:
- PLC model and firmware version
- Rust version and platform
- Steps to reproduce
- Expected vs actual behavior

## 💡 Feature Requests

We welcome feature requests! Please describe:
- Use case for the feature
- Proposed API design
- Any relevant PLC protocol details