import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database.db import Base, engine, SessionLocal
from app.api.routes import router as api_router
from app.services.ingestion import ingest_live_data, run_telemetry_historical_seed

# Load configurations
load_dotenv()

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

# Run seeding routine
db = SessionLocal()
try:
    print("Initializing Database Telemetry Seeding...")
    ingest_live_data(db)
    print("Database Telemetry Seeding Complete.")
except Exception as e:
    print(f"Error during initial seeding: {e}")
finally:
    db.close()

# Run historical seeding (for Recharts 24h trendlines)
run_telemetry_historical_seed()

app = FastAPI(
    title="Urban Air Quality Intelligence Platform API",
    description="Municipal Command Center Decision Support System API. Real-time telemetry, forecasts, attributions, and simulations.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev/hackathon environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API endpoints
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "Healthy",
        "service": "Urban AQI Command Center API",
        "documentation_docs": "/docs",
        "version": "1.0.0-Gov"
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
