# Go Backend for Rust EtherNet/IP Fullstack Example

This backend provides a REST API and WebSocket server for EtherNet/IP PLC communication, using the Rust Go wrapper for high-performance, type-safe access to Allen-Bradley PLCs.

## Features
- REST API for individual and batch tag operations
- WebSocket for real-time tag updates
- Performance benchmarking endpoint
- Uses the Rust Go wrapper (FFI)

## Endpoints
- `POST /api/connect` — Connect to PLC
- `POST /api/disconnect` — Disconnect
- `GET/POST /api/tag` — Read/write single tag
- `POST /api/batch` — Batch read/write
- `GET /api/taginfo` — Discover tag type
- `GET /api/test-read` — Debug read
- `POST /api/benchmark` — Run performance test
- `GET /ws` — WebSocket for real-time updates

## Usage

1. Ensure the Rust library is built and available as a shared library (DLL/SO/DYLIB).
2. Start the backend:
   ```bash
   go run .
   # or
   go build && ./backend
   ```
3. The server runs on `http://localhost:8080` by default.

## Dependencies
- Go 1.21+
- [gowrapper](../../../gowrapper/README.md) (local replace in go.mod)
- gorilla/mux, gorilla/websocket

## Troubleshooting
- If you see FFI errors, ensure the Rust shared library is present and accessible.
- For Go module issues, run `go mod tidy`.
- PLC must be reachable from the backend host.

## License
MIT 