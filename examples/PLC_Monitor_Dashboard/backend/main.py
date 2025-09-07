"""
PLC Monitor Dashboard - FastAPI Backend
Real-time PLC monitoring using rust-ethernet-ip library
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import uvicorn

# Import our Rust library
from rust_ethernet_ip import PyEipClient, PyPlcValue, PySubscriptionOptions

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for PLC connection and WebSocket connections
plc_client: Optional[PyEipClient] = None
active_connections: List[WebSocket] = []
tag_subscriptions: Dict[str, Any] = {}

# Pydantic models
class PLCConnection(BaseModel):
    address: str = Field(..., description="PLC IP address and port (e.g., 192.168.1.100:44818)")
    timeout: int = Field(default=5000, description="Connection timeout in milliseconds")

class TagReadRequest(BaseModel):
    tag_name: str = Field(..., description="Tag name to read")

class TagWriteRequest(BaseModel):
    tag_name: str = Field(..., description="Tag name to write to")
    value: Any = Field(..., description="Value to write")
    data_type: str = Field(default="dint", description="Data type (dint, real, bool, string)")

class TagSubscriptionRequest(BaseModel):
    tag_name: str = Field(..., description="Tag name to subscribe to")
    update_rate: int = Field(default=1000, description="Update rate in milliseconds")
    change_threshold: float = Field(default=0.1, description="Change threshold for numeric values")

class TagValue(BaseModel):
    tag_name: str
    value: Any
    data_type: str
    timestamp: datetime
    quality: str = "good"

class PLCStatus(BaseModel):
    connected: bool
    address: Optional[str] = None
    last_connection: Optional[datetime] = None
    active_subscriptions: int = 0

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

# Background task for PLC monitoring
async def plc_monitor_task():
    """Background task to monitor PLC tags and broadcast updates"""
    global plc_client, tag_subscriptions
    
    while True:
        try:
            if plc_client and tag_subscriptions:
                # Read all subscribed tags
                for tag_name, subscription in tag_subscriptions.items():
                    try:
                        # Read tag value
                        value = plc_client.read_tag(tag_name)
                        
                        # Create tag value object
                        tag_value = TagValue(
                            tag_name=tag_name,
                            value=value.value,
                            data_type=type(value.value).__name__,
                            timestamp=datetime.now(),
                            quality="good"
                        )
                        
                        # Broadcast to all connected clients
                        await manager.broadcast(tag_value.model_dump_json())
                        
                    except Exception as e:
                        logger.error(f"Error reading tag {tag_name}: {e}")
                        # Send error status
                        error_value = TagValue(
                            tag_name=tag_name,
                            value=None,
                            data_type="error",
                            timestamp=datetime.now(),
                            quality="bad"
                        )
                        await manager.broadcast(error_value.model_dump_json())
            
            # Wait before next update
            await asyncio.sleep(0.5)  # 500ms update rate
            
        except Exception as e:
            logger.error(f"Error in PLC monitor task: {e}")
            await asyncio.sleep(1)

# FastAPI app with lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting PLC Monitor Dashboard Backend")
    # Start background monitoring task
    monitor_task = asyncio.create_task(plc_monitor_task())
    yield
    # Shutdown
    logger.info("Shutting down PLC Monitor Dashboard Backend")
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="PLC Monitor Dashboard API",
    description="Real-time PLC monitoring using rust-ethernet-ip",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.get("/")
async def root():
    return {"message": "PLC Monitor Dashboard API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/connect")
async def connect_to_plc(connection: PLCConnection):
    """Connect to PLC"""
    global plc_client
    
    try:
        # Create new PLC client
        plc_client = PyEipClient(connection.address)
        
        # Test connection by reading a simple tag (this will fail if not connected)
        # For now, we'll assume connection is successful
        logger.info(f"Connected to PLC at {connection.address}")
        
        return {
            "status": "connected",
            "address": connection.address,
            "timestamp": datetime.now()
        }
    except Exception as e:
        logger.error(f"Failed to connect to PLC: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to connect to PLC: {str(e)}")

@app.post("/disconnect")
async def disconnect_from_plc():
    """Disconnect from PLC"""
    global plc_client, tag_subscriptions
    
    try:
        if plc_client:
            plc_client.unregister_session()
            plc_client = None
        
        # Clear subscriptions
        tag_subscriptions.clear()
        
        logger.info("Disconnected from PLC")
        return {"status": "disconnected", "timestamp": datetime.now()}
    except Exception as e:
        logger.error(f"Error disconnecting from PLC: {e}")
        raise HTTPException(status_code=500, detail=f"Error disconnecting: {str(e)}")

@app.get("/status")
async def get_plc_status():
    """Get PLC connection status"""
    global plc_client, tag_subscriptions
    
    return PLCStatus(
        connected=plc_client is not None,
        address=plc_client.address if plc_client else None,
        last_connection=datetime.now() if plc_client else None,
        active_subscriptions=len(tag_subscriptions)
    )

@app.post("/tags/read")
async def read_tag(request: TagReadRequest):
    """Read a single tag value"""
    global plc_client
    
    if not plc_client:
        raise HTTPException(status_code=400, detail="Not connected to PLC")
    
    try:
        value = plc_client.read_tag(request.tag_name)
        
        return TagValue(
            tag_name=request.tag_name,
            value=value.value,
            data_type=type(value.value).__name__,
            timestamp=datetime.now(),
            quality="good"
        )
    except Exception as e:
        logger.error(f"Error reading tag {request.tag_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading tag: {str(e)}")

@app.post("/tags/write")
async def write_tag(request: TagWriteRequest):
    """Write a value to a tag"""
    global plc_client
    
    if not plc_client:
        raise HTTPException(status_code=400, detail="Not connected to PLC")
    
    try:
        # Create PyPlcValue based on data type
        if request.data_type == "dint":
            plc_value = PyPlcValue.dint(int(request.value))
        elif request.data_type == "real":
            plc_value = PyPlcValue.real(float(request.value))
        elif request.data_type == "bool":
            plc_value = PyPlcValue(request.value)
        elif request.data_type == "string":
            plc_value = PyPlcValue.string(str(request.value))
        else:
            raise ValueError(f"Unsupported data type: {request.data_type}")
        
        # Write the value
        success = plc_client.write_tag(request.tag_name, plc_value)
        
        if success:
            return {"status": "success", "message": f"Tag {request.tag_name} written successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to write tag")
            
    except Exception as e:
        logger.error(f"Error writing tag {request.tag_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error writing tag: {str(e)}")

@app.post("/tags/subscribe")
async def subscribe_to_tag(request: TagSubscriptionRequest):
    """Subscribe to a tag for real-time updates"""
    global plc_client, tag_subscriptions
    
    if not plc_client:
        raise HTTPException(status_code=400, detail="Not connected to PLC")
    
    try:
        # Create subscription options
        options = PySubscriptionOptions(
            update_rate=request.update_rate,
            change_threshold=request.change_threshold,
            timeout=5000
        )
        
        # Subscribe to tag
        plc_client.subscribe_to_tag(request.tag_name, options)
        
        # Add to our subscription tracking
        tag_subscriptions[request.tag_name] = {
            "update_rate": request.update_rate,
            "change_threshold": request.change_threshold,
            "subscribed_at": datetime.now()
        }
        
        logger.info(f"Subscribed to tag: {request.tag_name}")
        return {"status": "subscribed", "tag_name": request.tag_name}
        
    except Exception as e:
        logger.error(f"Error subscribing to tag {request.tag_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error subscribing to tag: {str(e)}")

@app.delete("/tags/subscribe/{tag_name}")
async def unsubscribe_from_tag(tag_name: str):
    """Unsubscribe from a tag"""
    global tag_subscriptions
    
    if tag_name in tag_subscriptions:
        del tag_subscriptions[tag_name]
        logger.info(f"Unsubscribed from tag: {tag_name}")
        return {"status": "unsubscribed", "tag_name": tag_name}
    else:
        raise HTTPException(status_code=404, detail="Tag not found in subscriptions")

@app.get("/tags/subscriptions")
async def get_subscriptions():
    """Get all active tag subscriptions"""
    return {"subscriptions": tag_subscriptions}

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for ping/pong
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
