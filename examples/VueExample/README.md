# Rust EtherNet/IP Vue.js Frontend

A modern Vue.js 3 frontend application for the Rust EtherNet/IP library, designed to integrate with ASP.NET Core backends for industrial automation and PLC communication.

## 🚀 **Today's Progress (Latest Session)**

### **What We Accomplished**
- ✅ **Created complete Vue.js 3 frontend** with TypeScript and Tailwind CSS
- ✅ **Built comprehensive component architecture** including Dashboard, Tag Operations, and more
- ✅ **Implemented Pinia state management** for connection and application state
- ✅ **Created API service layer** with Axios for backend communication
- ✅ **Added backend detection system** to automatically find ASP.NET Core backend ports
- ✅ **Built responsive UI components** with modern design patterns
- ✅ **Set up Vite development environment** with proper proxy configuration

### **Current Status**
- 🔧 **Frontend is fully functional** and ready for backend integration
- 🔧 **Backend detection is implemented** but needs endpoint configuration
- 🔧 **API service is ready** but requires working backend endpoints
- 🔧 **UI components are complete** and styled with Tailwind CSS

### **Known Issues to Resolve**
- ❌ **Backend endpoints returning 404** - need to verify correct API paths
- ❌ **Port 5000 detected** but `/api/*` endpoints not responding
- ❌ **CORS configuration** may need adjustment on backend
- ❌ **Health check endpoint** not found on ASP.NET backend

### **Next Steps for Future Sessions**
1. **Verify ASP.NET backend endpoints** - check what `/api/*` routes actually exist
2. **Test backend connectivity** - use the BackendDetector component to debug
3. **Configure CORS** on the backend if needed
4. **Test API integration** once endpoints are working
5. **Add real PLC communication** functionality

---

## Features

- **Modern Vue.js 3 Architecture**: Built with Composition API and TypeScript
- **Real-time PLC Communication**: Connect to Allen-Bradley PLCs via EtherNet/IP
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: Pinia store for application state
- **Type Safety**: Full TypeScript support
- **API Integration**: Axios-based service layer for backend communication
- **Component Library**: Reusable UI components with consistent styling
- **Routing**: Vue Router for navigation between different views
- **Development Tools**: Vite for fast development and building
- **Backend Detection**: Automatic detection of ASP.NET Core backend ports

## Architecture

### Frontend Stack
- **Vue.js 3**: Progressive JavaScript framework
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Pinia**: State management library
- **Vue Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **Vite**: Build tool and development server

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ConnectionPanel.vue      # PLC connection management
│   ├── ConnectionStatus.vue     # Connection status display
│   ├── StatusCard.vue           # Metric display cards
│   ├── QuickActionCard.vue      # Action buttons
│   └── BackendDetector.vue      # Backend connectivity testing
├── views/              # Page components
│   ├── Dashboard.vue            # Main dashboard view
│   ├── TagOperations.vue        # Tag read/write operations
│   ├── BatchOperations.vue      # Batch operations (placeholder)
│   ├── Performance.vue          # Performance monitoring (placeholder)
│   └── Settings.vue             # Application settings (placeholder)
├── stores/             # Pinia state stores
│   └── connection.ts            # Connection state management
├── services/           # API and business logic services
│   └── api.ts                  # Axios-based API service
├── config/             # Configuration files
│   └── backend.ts              # Backend detection and configuration
├── router/             # Vue Router configuration
└── style.css           # Global styles
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- ASP.NET Core backend running (see Backend Requirements)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser

### Backend Requirements
The frontend expects an ASP.NET Core backend with the following endpoints:
- `POST /api/connect` - Establish PLC connection
- `POST /api/disconnect` - Disconnect from PLC
- `GET /api/status` - Get connection status
- `GET /api/tag/{name}` - Read tag value
- `POST /api/tag/{name}` - Write tag value
- `POST /api/batch` - Execute batch operations
- `GET /api/tags` - Discover available tags
- `GET /api/health` - Health check endpoint

## Available Views

### Dashboard
- Connection status and uptime
- Quick action cards for common operations
- Recent activity log
- Performance metrics
- **Backend Detection Panel** (development mode only)

### Tag Operations
- Individual tag read/write operations
- Data type selection
- Operation history
- Real-time results

### Batch Operations
- Multiple tag operations in a single request
- Performance optimization
- Bulk data processing
- *Currently a placeholder view*

### Performance
- Benchmark testing
- Response time monitoring
- Throughput analysis
- *Currently a placeholder view*

### Settings
- Application configuration
- Connection preferences
- User preferences
- *Currently a placeholder view*

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode enabled
- ESLint with Vue.js rules
- Prettier formatting
- Component naming conventions

### State Management
The application uses Pinia for state management with the following stores:
- **Connection Store**: Manages PLC connection state, configuration, and errors
- **Tag Store**: Handles tag operations and caching (to be implemented)
- **Settings Store**: Application configuration (to be implemented)

## Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=EtherNet/IP Dashboard
VITE_APP_VERSION=0.4.0
VITE_APP_DESCRIPTION=PLC Communication Dashboard
```

### Backend Configuration
The frontend automatically detects backend availability and can be configured to:
- Use Vite proxy (default)
- Connect directly to backend
- Fallback between multiple backend ports (5000, 5001, 7000, 7001, 8000, 8001)

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

## Backend Detection System

### How It Works
The frontend includes an intelligent backend detection system that:
1. **Tests common ASP.NET Core ports** (5000, 5001, 7000, 7001, 8000, 8001)
2. **Tries multiple endpoints** (`/health`, `/api/health`, `/`, `/api`, `/swagger`)
3. **Validates HTTP responses** to ensure endpoints are actually working
4. **Falls back to proxy mode** if no backend is detected
5. **Provides debugging tools** through the BackendDetector component

### BackendDetector Component
A development-only component that provides:
- **Port detection results** showing which ports are accessible
- **Endpoint testing** for specific ports
- **Manual port testing** for custom port numbers
- **API configuration status** showing current connection method

## Deployment

### Build
```bash
npm run build
```

### Production
The built application can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Traditional web servers

### Docker
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Responsive Design

The application is designed to work on all device sizes:
- **Mobile**: Single-column layout with touch-friendly controls
- **Tablet**: Two-column layout for better space utilization
- **Desktop**: Full multi-column layout with advanced features

## Security

- CORS configuration for backend communication
- Input validation and sanitization
- Secure API communication
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow Vue.js style guide
- Use TypeScript for all new code
- Write meaningful commit messages
- Update documentation for new features

## Troubleshooting

### Common Issues

#### Connection Problems
- Verify backend is running and accessible
- Check CORS configuration
- Ensure correct API endpoints
- Use BackendDetector component to debug connectivity

#### Build Errors
- Clear node_modules and reinstall
- Check TypeScript configuration
- Verify Vite configuration

#### Runtime Errors
- Check browser console for errors
- Verify API service configuration
- Check network tab for failed requests
- Use BackendDetector to test backend endpoints

### Debugging Tools
- **BackendDetector Component**: Tests backend connectivity and shows results
- **Console Logging**: Detailed logging for backend detection and API calls
- **Network Tab**: Monitor actual HTTP requests and responses
- **Vite Proxy Logging**: Shows proxy configuration and routing

## Resources

- [Vue.js Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Acknowledgments

- Built with the Rust EtherNet/IP library
- Designed for industrial automation workflows
- Inspired by modern web application patterns
- Backend detection system inspired by common development challenges
