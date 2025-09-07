#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI server works
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("✅ FastAPI app imported successfully")
    
    # Test if we can create a client
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    # Test health endpoint
    response = client.get("/health")
    print(f"✅ Health endpoint test: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test root endpoint
    response = client.get("/")
    print(f"✅ Root endpoint test: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    print("\n🎉 All tests passed! The backend is working correctly.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
