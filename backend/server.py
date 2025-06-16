from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ElectricityCalculation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    calculation_type: str  # 'kw_to_money' or 'money_to_kw'
    meter_type: str  # 'residential', 'commercial', 'factory'
    previous_reading: Optional[float] = None
    current_reading: Optional[float] = None
    consumption: Optional[float] = None
    amount: Optional[float] = None
    total_cost: Optional[float] = None
    breakdown: Optional[List[dict]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ElectricityCalculationCreate(BaseModel):
    calculation_type: str
    meter_type: str
    previous_reading: Optional[float] = None
    current_reading: Optional[float] = None
    consumption: Optional[float] = None
    amount: Optional[float] = None
    total_cost: Optional[float] = None
    breakdown: Optional[List[dict]] = None

# Electricity rate configurations
RATES = {
    "residential": [
        {"min": 1, "max": 200, "rate": 2.19},
        {"min": 201, "max": 400, "rate": 5.63},
        {"min": 401, "max": 700, "rate": 8.13},
        {"min": 701, "max": 2000, "rate": 11.25},
        {"min": 2001, "max": float('inf'), "rate": 12.5}
    ],
    "commercial": {"rate": 16.25},
    "factory": {"rate": 6.75}
}

def calculate_residential_cost(kw: float):
    """Calculate cost for residential meter with tiered pricing"""
    total_cost = 0
    remaining_kw = kw
    breakdown = []

    for tier in RATES["residential"]:
        if remaining_kw <= 0:
            break
        
        tier_range = float('inf') if tier["max"] == float('inf') else tier["max"] - tier["min"] + 1
        tier_usage = min(remaining_kw, tier_range)
        
        if tier_usage > 0:
            tier_cost = tier_usage * tier["rate"]
            total_cost += tier_cost
            breakdown.append({
                "tier": f"{tier['min']}-{tier['max'] if tier['max'] != float('inf') else '∞'}",
                "usage": tier_usage,
                "rate": tier["rate"],
                "cost": tier_cost
            })
            remaining_kw -= tier_usage

    return {"total_cost": total_cost, "breakdown": breakdown}

def calculate_flat_rate_cost(kw: float, rate: float):
    """Calculate cost for commercial/factory meters with flat rate"""
    total_cost = kw * rate
    breakdown = [{
        "tier": "0-∞",
        "usage": kw,
        "rate": rate,
        "cost": total_cost
    }]
    return {"total_cost": total_cost, "breakdown": breakdown}

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Electricity Meter Calculator API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/calculate", response_model=ElectricityCalculation)
async def create_calculation(input: ElectricityCalculationCreate):
    """Create and store an electricity calculation"""
    calculation_dict = input.dict()
    calculation_obj = ElectricityCalculation(**calculation_dict)
    
    # Store in database
    await db.electricity_calculations.insert_one(calculation_obj.dict())
    
    return calculation_obj

@api_router.get("/calculations", response_model=List[ElectricityCalculation])
async def get_calculations(limit: int = 100):
    """Get stored electricity calculations"""
    calculations = await db.electricity_calculations.find().sort("timestamp", -1).to_list(limit)
    return [ElectricityCalculation(**calc) for calc in calculations]

@api_router.post("/calculate/kw-to-money")
async def calculate_kw_to_money(
    meter_type: str,
    previous_reading: float,
    current_reading: float
):
    """Calculate cost from kW consumption"""
    consumption = current_reading - previous_reading
    
    if consumption <= 0:
        return {"error": "Current reading must be greater than previous reading"}
    
    if meter_type == "residential":
        result = calculate_residential_cost(consumption)
    elif meter_type == "commercial":
        result = calculate_flat_rate_cost(consumption, RATES["commercial"]["rate"])
    elif meter_type == "factory":
        result = calculate_flat_rate_cost(consumption, RATES["factory"]["rate"])
    else:
        return {"error": "Invalid meter type"}
    
    return {
        "consumption": consumption,
        "total_cost": result["total_cost"],
        "breakdown": result["breakdown"],
        "meter_type": meter_type
    }

@api_router.post("/calculate/money-to-kw")
async def calculate_money_to_kw(
    meter_type: str,
    amount: float
):
    """Calculate kW from money amount"""
    if amount <= 0:
        return {"error": "Amount must be greater than 0"}
    
    total_kw = 0
    
    if meter_type == "residential":
        remaining_amount = amount
        for tier in RATES["residential"]:
            if remaining_amount <= 0:
                break
            
            tier_range = float('inf') if tier["max"] == float('inf') else tier["max"] - tier["min"] + 1
            max_tier_cost = float('inf') if tier_range == float('inf') else tier_range * tier["rate"]
            
            if remaining_amount >= max_tier_cost and tier_range != float('inf'):
                total_kw += tier_range
                remaining_amount -= max_tier_cost
            else:
                total_kw += remaining_amount / tier["rate"]
                break
    elif meter_type == "commercial":
        total_kw = amount / RATES["commercial"]["rate"]
    elif meter_type == "factory":
        total_kw = amount / RATES["factory"]["rate"]
    else:
        return {"error": "Invalid meter type"}
    
    return {
        "amount": amount,
        "total_kw": round(total_kw, 2),
        "meter_type": meter_type
    }

@api_router.get("/rates")
async def get_rates():
    """Get current electricity rates"""
    return RATES

@api_router.delete("/calculations")
async def clear_calculations():
    """Clear all stored calculations"""
    result = await db.electricity_calculations.delete_many({})
    return {"deleted_count": result.deleted_count}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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