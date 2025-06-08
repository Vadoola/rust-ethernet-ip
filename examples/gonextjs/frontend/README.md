# Next.js Frontend for Rust EtherNet/IP Fullstack Example

A modern, responsive web UI for EtherNet/IP PLC operations, built with Next.js (TypeScript, Tailwind CSS, App Router).

## Features
- Connect/disconnect to PLC
- Individual and batch tag read/write
- Performance benchmarking
- Real-time updates via WebSocket
- Activity log and error reporting
- Modern UI with Tailwind CSS

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Usage
- Enter your PLC IP (e.g., `192.168.0.1:44818`) and connect.
- Use the tabs for individual, batch, and performance operations.
- Batch read: `TagName:Type` per line (e.g., `TestBool:Bool`)
- Batch write: `TagName:Type=Value` per line (e.g., `TestInt:Dint=123`)
- View results and logs in the UI.

## Troubleshooting
- Ensure the backend is running on `http://localhost:8080`.
- For CORS or network errors, check backend status and browser console.
- PLC must be reachable from the backend host.

## License
MIT 