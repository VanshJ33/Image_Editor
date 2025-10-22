from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Klippy API Proxy Endpoints
KLIPPY_API_KEY = "X4eTCMg7rLGxEVw0r3lIaBrxuVfhGrGGZblYCdqQWZP9zx4xTsIWSwQTU67tnhqa"
KLIPPY_BASE_URL = "https://api.klippy.ai/v1"

@api_router.get("/klippy/elements")
async def get_klippy_elements(limit: int = 20, category: Optional[str] = None, sort: str = "popular"):
    try:
        params = {
            "limit": limit,
            "format": "svg",
            "sort": sort
        }
        if category and category != "all":
            params["category"] = category
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{KLIPPY_BASE_URL}/elements",
                params=params,
                headers={"Authorization": f"Bearer {KLIPPY_API_KEY}"},
                timeout=10.0
            )
            
        if response.status_code == 200:
            return response.json()
        else:
            # Return mock data if API fails
            return {
                "elements": [
                    {
                        "id": "1",
                        "title": "Heart",
                        "category": "shapes",
                        "svg_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01MCA4NSBDNTAgODUgMTUgNjAgMTUgNDAgQzE1IDI1IDI1IDE1IDQwIDIwIEM0NSAxMCA1NSAxMCA2MCAyMCBDNzUgMTUgODUgMjUgODUgNDAgQzg1IDYwIDUwIDg1IDUwIDg1IFoiIGZpbGw9IiNFRjQ0NDQiLz4KPC9zdmc+",
                        "preview_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01MCA4NSBDNTAgODUgMTUgNjAgMTUgNDAgQzE1IDI1IDI1IDE1IDQwIDIwIEM0NSAxMCA1NSAxMCA2MCAyMCBDNzUgMTUgODUgMjUgODUgNDAgQzg1IDYwIDUwIDg1IDUwIDg1IFoiIGZpbGw9IiNFRjQ0NDQiLz4KPC9zdmc+"
                    },
                    {
                        "id": "2",
                        "title": "Star",
                        "category": "shapes",
                        "svg_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cjxwb2x5Z29uIHBvaW50cz0iNTAsMTAgNjEsMzUgOTAsMzUgNjksNTUgNzksODUgNTAsNzAgMjEsODUgMzEsNTUgMTAsMzUgMzksMzUiIGZpbGw9IiNGNTlFMEIiLz4KPC9zdmc+",
                        "preview_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cjxwb2x5Z29uIHBvaW50cz0iNTAsMTAgNjEsMzUgOTAsMzUgNjksNTUgNzksODUgNTAsNzAgMjEsODUgMzEsNTUgMTAsMzUgMzksMzUiIGZpbGw9IiNGNTlFMEIiLz4KPC9zdmc+"
                    }
                ]
            }
            
    except Exception as e:
        logger.error(f"Klippy API error: {e}")
        # Return mock data on error
        return {
            "elements": [
                {
                    "id": "1",
                    "title": "Heart",
                    "category": "shapes",
                    "svg_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01MCA4NSBDNTAgODUgMTUgNjAgMTUgNDAgQzE1IDI1IDI1IDE1IDQwIDIwIEM0NSAxMCA1NSAxMCA2MCAyMCBDNzUgMTUgODUgMjUgODUgNDAgQzg1IDYwIDUwIDg1IDUwIDg1IFoiIGZpbGw9IiNFRjQ0NDQiLz4KPC9zdmc+",
                    "preview_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01MCA4NSBDNTAgODUgMTUgNjAgMTUgNDAgQzE1IDI1IDI1IDE1IDQwIDIwIEM0NSAxMCA1NSAxMCA2MCAyMCBDNzUgMTUgODUgMjUgODUgNDAgQzg1IDYwIDUwIDg1IDUwIDg1IFoiIGZpbGw9IiNFRjQ0NDQiLz4KPC9zdmc+"
                },
                {
                    "id": "2",
                    "title": "Star",
                    "category": "shapes",
                    "svg_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cjxwb2x5Z29uIHBvaW50cz0iNTAsMTAgNjEsMzUgOTAsMzUgNjksNTUgNzksODUgNTAsNzAgMjEsODUgMzEsNTUgMTAsMzUgMzksMzUiIGZpbGw9IiNGNTlFMEIiLz4KPC9zdmc+",
                    "preview_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cjxwb2x5Z29uIHBvaW50cz0iNTAsMTAgNjEsMzUgOTAsMzUgNjksNTUgNzksODUgNTAsNzAgMjEsODUgMzEsNTUgMTAsMzUgMzksMzUiIGZpbGw9IiNGNTlFMEIiLz4KPC9zdmc+"
                }
            ]
        }

@api_router.get("/klippy/search")
async def search_klippy_elements(q: str, limit: int = 20, category: Optional[str] = None):
    try:
        params = {
            "q": q,
            "limit": limit,
            "format": "svg"
        }
        if category and category != "all":
            params["category"] = category
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{KLIPPY_BASE_URL}/search",
                params=params,
                headers={"Authorization": f"Bearer {KLIPPY_API_KEY}"},
                timeout=10.0
            )
            
        if response.status_code == 200:
            return response.json()
        else:
            return {"elements": []}
            
    except Exception as e:
        logger.error(f"Klippy search error: {e}")
        return {"elements": []}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()