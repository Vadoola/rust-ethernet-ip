# PLC Monitor Dashboard

A full-stack real-time PLC monitoring system built with **Rust**, **Python FastAPI**, and **React TypeScript**. This example demonstrates the power of the `rust-ethernet-ip` library in a production-ready web application.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React/TS      │    │   Python        │    │   Rust          │
│   Frontend      │◄──►│   FastAPI       │◄──►│   ethernet-ip   │
│   (Port 3000)   │    │   Backend       │    │   Library       │
│                 │    │   (Port 8000)   │    │   (PyO3 0.26)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   REST API      │    │   EtherNet/IP   │
│   Real-time     │    │   CRUD Ops      │    │   PLC Protocol  │
│   Updates       │    │   Management    │    │   Communication │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### 🔌 PLC Communication
- **Real-time tag monitoring** with WebSocket updates
- **Read/Write operations** for all PLC data types
- **Batch operations** for high-performance data handling
- **Connection management** with automatic reconnection
- **Tag subscriptions** with configurable update rates

### 🎨 Modern Web Interface
- **Responsive design** with Tailwind CSS
- **Real-time charts** using Recharts
- **Interactive tag cards** with inline editing
- **Connection status** monitoring
- **Notification system** for user feedback
- **Dark/light theme** support

### 🚀 Production Ready
- **Docker containerization** for easy deployment
- **Health checks** and monitoring
- **Error handling** and logging
- **CORS configuration** for security
- **TypeScript** for type safety
- **RESTful API** design

## 🛠️ Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Core Library** | Rust | Latest | EtherNet/IP protocol implementation |
| **Python Bindings** | PyO3 | 0.26.0 | Python interface to Rust library |
| **Backend** | FastAPI | 0.104.1 | REST API and WebSocket server |
| **Frontend** | React + TypeScript | 18.2.0 | Modern web interface |
| **Styling** | Tailwind CSS | 3.3.0 | Utility-first CSS framework |
| **Charts** | Recharts | 2.8.0 | Data visualization |
| **Icons** | Lucide React | 0.294.0 | Beautiful icon library |
| **Containerization** | Docker | Latest | Application packaging |

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Python 3.11+** (for local development)
- **Node.js 18+** (for local development)
- **Rust** (for building the library)

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to the example:**
   ```bash
   cd examples/PLC_Monitor_Dashboard
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8000
   - **API Documentation:** http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## 📖 Usage Guide

### 1. Connect to PLC

1. Open the web interface at http://localhost:3000
2. Enter your PLC's IP address and port (e.g., `192.168.1.100:44818`)
3. Click "Connect" to establish connection

### 2. Monitor Tags

1. **Subscribe to tags** for real-time monitoring
2. **View tag values** in the dashboard cards
3. **Edit values** by clicking the edit icon on tag cards
4. **Select tags** to view historical data charts

### 3. API Usage

#### Connect to PLC
```bash
curl -X POST "http://localhost:8000/connect" \
  -H "Content-Type: application/json" \
  -d '{"address": "192.168.1.100:44818", "timeout": 5000}'
```

#### Read Tag Value
```bash
curl -X POST "http://localhost:8000/tags/read" \
  -H "Content-Type: application/json" \
  -d '{"tag_name": "MyTag"}'
```

#### Write Tag Value
```bash
curl -X POST "http://localhost:8000/tags/write" \
  -H "Content-Type: application/json" \
  -d '{"tag_name": "MyTag", "value": 42, "data_type": "dint"}'
```

#### Subscribe to Tag
```bash
curl -X POST "http://localhost:8000/tags/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"tag_name": "MyTag", "update_rate": 1000, "change_threshold": 0.1}'
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# PLC Configuration
DEFAULT_PLC_TIMEOUT=5000
DEFAULT_UPDATE_RATE=1000
DEFAULT_CHANGE_THRESHOLD=0.1

# Logging
LOG_LEVEL=INFO
```

#### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000

# Chart Configuration
REACT_APP_MAX_CHART_POINTS=50
REACT_APP_CHART_UPDATE_INTERVAL=500
```

### Docker Configuration

Modify `docker-compose.yml` to customize:
- **Port mappings**
- **Environment variables**
- **Volume mounts**
- **Network configuration**

## 📊 API Documentation

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/status` | PLC connection status |
| `POST` | `/connect` | Connect to PLC |
| `POST` | `/disconnect` | Disconnect from PLC |
| `POST` | `/tags/read` | Read single tag |
| `POST` | `/tags/write` | Write to tag |
| `POST` | `/tags/subscribe` | Subscribe to tag |
| `DELETE` | `/tags/subscribe/{name}` | Unsubscribe from tag |
| `GET` | `/tags/subscriptions` | Get all subscriptions |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `message` | Real-time tag value updates |
| `error` | Connection or communication errors |
| `status` | Connection status changes |

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Start services
docker-compose up -d

# Run integration tests
python tests/integration_test.py
```

## 🚀 Deployment

### Production Deployment

1. **Build production images:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy with production settings:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Configure reverse proxy** (Nginx/Apache) for SSL termination

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 🔍 Monitoring & Logging

### Health Checks
- **Backend:** `GET /health`
- **Frontend:** Built-in React health checks
- **Docker:** Container health checks

### Logging
- **Backend:** Structured logging with Python logging
- **Frontend:** Console logging with error boundaries
- **Docker:** Centralized logging with Docker logs

## 🛡️ Security

### Security Features
- **CORS configuration** for cross-origin requests
- **Input validation** with Pydantic models
- **Error handling** without sensitive data exposure
- **Non-root containers** for Docker security
- **Environment variable** configuration

### Best Practices
- Use HTTPS in production
- Implement authentication/authorization
- Regular security updates
- Network segmentation
- Input sanitization

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests**
5. **Submit a pull request**

## 📝 License

This example is part of the `rust-ethernet-ip` project and follows the same license terms.

## 🆘 Support

- **Documentation:** [rust-ethernet-ip docs](https://github.com/sergiogallegos/rust-ethernet-ip)
- **Issues:** [GitHub Issues](https://github.com/sergiogallegos/rust-ethernet-ip/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sergiogallegos/rust-ethernet-ip/discussions)

## 🎯 Roadmap

- [ ] **Authentication & Authorization**
- [ ] **Multi-PLC Support**
- [ ] **Advanced Charting**
- [ ] **Mobile App**
- [ ] **Historical Data Storage**
- [ ] **Alarm Management**
- [ ] **User Management**
- [ ] **API Rate Limiting**

---

**Built with ❤️ using Rust, Python, and TypeScript**
