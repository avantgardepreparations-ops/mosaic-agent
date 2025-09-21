#!/usr/bin/env python3
"""
FastAPI Multi-Agent Backend Server
Run with: python start_server.py

This server is STRICTLY SEPARATED from MOSAICMIND.
"""

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("🚀 Starting Multi-Agent FastAPI Backend")
    print("=" * 50)
    print("⚠️  ATTENTION: STRICTLY SEPARATED FROM MOSAICMIND")
    print("🔗 Server will run on: http://localhost:8000")
    print("📖 API docs available at: http://localhost:8000/docs")
    print("=" * 50)
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )