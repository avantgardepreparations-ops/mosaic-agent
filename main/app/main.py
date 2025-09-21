from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .routers import brain


# Create FastAPI application
app = FastAPI(
    title="Multi-Agent Liaison API",
    description="FastAPI backend for multi-agent system - STRICTLY SEPARATED FROM MOSAICMIND",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(brain.router, prefix="/api/v1", tags=["brain"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Multi-Agent Liaison API",
        "version": "1.0.0",
        "status": "running",
        "separation_warning": "NEVER integrate with MOSAICMIND"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)