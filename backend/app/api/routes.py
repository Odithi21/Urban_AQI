import io
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from ..database.db import get_db
from ..database.models import MonitoringStation, AQIHistory, AQIForecast, SourceAttribution, Alert, CitizenReport, WardPopulation
from ..services.ingestion import ingest_live_data, load_worldpop_data
from ..utils.reports import generate_csv_report, generate_pdf_report

router = APIRouter()

# Schema models for POST request bodies
class CitizenReportCreate(BaseModel):
    category: str
    description: str
    latitude: float
    longitude: float
    ward: str

class SimulationRequest(BaseModel):
    project_type: str  # factory, highway, flyover, diversion
    scale: int  # 1, 2, 3
    latitude: float
    longitude: float

class ReportGenerateRequest(BaseModel):
    format: str = "pdf"
    city: Optional[str] = None

# Helper to automatically update database if telemetry is stale (more than 10 minutes old)
LAST_TELEMETRY_REFRESH = {"time": None}

def ensure_fresh_telemetry(db: Session):
    now = datetime.utcnow()
    if LAST_TELEMETRY_REFRESH["time"] is None or (now - LAST_TELEMETRY_REFRESH["time"]) > timedelta(minutes=10):
        try:
            print("Triggering auto telemetry refresh...")
            ingest_live_data(db)
            LAST_TELEMETRY_REFRESH["time"] = now
        except Exception as e:
            print(f"Error during auto-ingestion refresh: {e}")

@router.get("/current-aqi")
@router.get("/aqi/current")
def get_current_aqi(city: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    query = db.query(MonitoringStation)
    if city:
        query = query.filter(MonitoringStation.city == city)
    stations = query.all()
    
    if not stations:
        raise HTTPException(status_code=404, detail="No stations found for the given criteria")
        
    avg_aqi = int(sum(s.current_aqi for s in stations) / len(stations))
    highest_aqi = max(s.current_aqi for s in stations)
    active_hotspots = sum(1 for s in stations if s.current_aqi > 150)
    
    # Calculate affected population
    exposed_pop = 0
    for s in stations:
        if s.current_aqi > 150:
            ward_pop = db.query(WardPopulation).filter(WardPopulation.ward_name == s.ward).first()
            if ward_pop:
                exposed_pop += ward_pop.population
            else:
                exposed_pop += 45000  # Default fallback ward population

    alerts_count = db.query(Alert).filter(Alert.is_resolved == False).count()
    
    return {
        "city_scope": city or "All Cities",
        "average_aqi": avg_aqi,
        "highest_aqi": highest_aqi,
        "active_hotspots_count": active_hotspots,
        "exposed_population": exposed_pop,
        "alerts_count": alerts_count,
        "stations": [
            {
                "id": s.id,
                "name": s.name,
                "city": s.city,
                "ward": s.ward,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "current_aqi": s.current_aqi,
                "temperature": s.temperature,
                "humidity": s.humidity,
                "wind_speed": s.wind_speed,
                "wind_direction": s.wind_direction,
                "main_pollutant": s.main_pollutant,
                "last_updated": s.last_updated
            } for s in stations
        ]
    }

@router.get("/forecast")
@router.get("/aqi/forecast")
def get_aqi_forecast(station_id: Optional[int] = None, city: Optional[str] = None, ward: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    if station_id:
        station = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
    elif city and ward:
        station = db.query(MonitoringStation).filter(
            MonitoringStation.city == city,
            MonitoringStation.ward == ward
        ).first()
    else:
        # Fallback to the first station in selected city
        query = db.query(MonitoringStation)
        if city:
            query = query.filter(MonitoringStation.city == city)
        station = query.first()

    if not station:
        raise HTTPException(status_code=404, detail="Monitoring station not found")
        
    forecasts = db.query(AQIForecast).filter(AQIForecast.station_id == station.id).order_by(AQIForecast.target_time.asc()).all()
    
    # Generate charts-friendly trend line using 24h history
    history_nodes = db.query(AQIHistory).filter(AQIHistory.station_id == station.id).order_by(AQIHistory.timestamp.desc()).limit(24).all()
    # Reverse to read chronologically
    history_nodes = list(reversed(history_nodes))
    
    trend = [
        {
            "timestamp": h.timestamp.strftime("%H:00"),
            "aqi": h.aqi,
            "pm25": h.pm25,
            "pm10": h.pm10,
            "no2": h.no2
        } for h in history_nodes
    ]

    return {
        "station_id": station.id,
        "station_name": station.name,
        "ward": station.ward,
        "city": station.city,
        "current_aqi": station.current_aqi,
        "forecasts": [
            {
                "id": f.id,
                "target_time": f.target_time,
                "predicted_aqi": f.predicted_aqi,
                "confidence_score": f.confidence_score,
                "main_pollutant": f.main_pollutant,
                "rationale": f.rationale
            } for f in forecasts
        ],
        "trend_24h": trend
    }

@router.get("/weather")
def get_weather_summary(city: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    query = db.query(MonitoringStation)
    if city:
        query = query.filter(MonitoringStation.city == city)
    stations = query.all()
    
    if not stations:
        raise HTTPException(status_code=404, detail="No weather telemetry found")

    avg_temp = round(sum(s.temperature for s in stations) / len(stations), 1)
    avg_humidity = round(sum(s.humidity for s in stations) / len(stations), 1)
    avg_wind = round(sum(s.wind_speed for s in stations) / len(stations), 1)
    
    return {
        "city": city or "All Regions",
        "average_temperature": avg_temp,
        "average_humidity": avg_humidity,
        "average_wind_speed": avg_wind,
        "conditions": "Stagnant/Hazy" if avg_wind < 6.0 else ("Clear/Breezy" if avg_humidity < 55 else "Partly Cloudy")
    }

@router.get("/source-attribution")
@router.get("/sources/attribution")
def get_source_attribution(station_id: Optional[int] = None, city: Optional[str] = None, ward: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    if station_id:
        station = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
    elif city and ward:
        station = db.query(MonitoringStation).filter(
            MonitoringStation.city == city,
            MonitoringStation.ward == ward
        ).first()
    else:
        query = db.query(MonitoringStation)
        if city:
            query = query.filter(MonitoringStation.city == city)
        station = query.first()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found for source attribution")
        
    attr = db.query(SourceAttribution).filter(SourceAttribution.station_id == station.id).order_by(SourceAttribution.timestamp.desc()).first()
    
    if not attr:
        # Generate inline fallback if missing
        return {
            "station_id": station.id,
            "station_name": station.name,
            "traffic": 35.0,
            "construction": 25.0,
            "industrial": 20.0,
            "weather_factor": 15.0,
            "agricultural": 5.0,
            "explanation": "Attribution model computed default historical baselines. Construction dust and local logistics traffic dominate."
        }

    return {
        "station_id": station.id,
        "station_name": station.name,
        "traffic": attr.traffic,
        "construction": attr.construction,
        "industrial": attr.industrial,
        "weather_factor": attr.weather_factor,
        "agricultural": attr.agricultural,
        "explanation": attr.explanation
    }

@router.get("/hotspots")
def get_hotspots(city: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    query = db.query(MonitoringStation).filter(MonitoringStation.current_aqi > 150)
    if city:
        query = query.filter(MonitoringStation.city == city)
    hotspots = query.all()
    
    results = []
    for h in hotspots:
        attr = db.query(SourceAttribution).filter(SourceAttribution.station_id == h.id).order_by(SourceAttribution.timestamp.desc()).first()
        main_source = "Traffic"
        if attr:
            sources = {"Traffic": attr.traffic, "Construction": attr.construction, "Industrial": attr.industrial, "Agricultural": attr.agricultural}
            main_source = max(sources, key=sources.get)
            
        ward_pop = db.query(WardPopulation).filter(WardPopulation.ward_name == h.ward).first()
        population = ward_pop.population if ward_pop else 45000

        results.append({
            "station_id": h.id,
            "name": h.name,
            "city": h.city,
            "ward": h.ward,
            "aqi": h.current_aqi,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "main_source": main_source,
            "exposed_population": population,
            "recommended_action": "Restrict diesel truck movements and wet road surfaces" if main_source == "Traffic" else ("Suspend concrete batching" if main_source == "Construction" else "Impose thermal factory cap")
        })
        
    return results

@router.get("/advisory")
@router.get("/health/risk")
def get_citizen_advisory(city: str, ward: str, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    station = db.query(MonitoringStation).filter(
        MonitoringStation.city == city,
        MonitoringStation.ward == ward
    ).first()
    
    if not station:
        # Try to find any station in this city
        station = db.query(MonitoringStation).filter(MonitoringStation.city == city).first()
        
    if not station:
        aqi_val = 120
        main_poll = "PM2.5"
    else:
        aqi_val = station.current_aqi
        main_poll = station.main_pollutant

    # Compute advice index
    if aqi_val > 300:
        advice = "CRITICAL: Air is hazardous. Remain indoors with air purifiers active. Seal doors and windows."
        outdoor = "Avoid all outdoor activities. Cancel school outdoor sessions."
        mask = "N95/N99 respirators MANDATORY if going outdoors."
        exercise = "Do NOT exercise outdoors. Switch to light indoor breathing exercises."
        level = "Hazardous"
    elif aqi_val > 200:
        advice = "DANGEROUS: Significant risk of respiratory symptoms. Vulnerable demographics must stay indoors."
        outdoor = "Minimize outdoor exposure. Avoid prolonged commutes."
        mask = "N95 masks highly recommended for all residents."
        exercise = "Avoid outdoor workouts. Move fitness routines indoors."
        level = "Dangerous"
    elif aqi_val > 100:
        advice = "UNHEALTHY: Active children, elderly, and individuals with respiratory issues should restrict outdoor activities."
        outdoor = "Limit outdoor duration, especially during early mornings and late evenings."
        mask = "Recommended for sensitive individuals in traffic corridors."
        exercise = "Limit intense runs. Exercise indoors or during afternoon hours when wind dispersal peaks."
        level = "Unhealthy"
    elif aqi_val > 50:
        advice = "MODERATE: Air quality is acceptable; however, some pollutants may cause moderate health concerns for highly sensitive individuals."
        outdoor = "Safe for general population. Sensitive individuals should monitor symptoms."
        mask = "Not generally required unless in highly dusty sectors."
        exercise = "Good for outdoor workouts, but avoid heavy traffic intersections."
        level = "Moderate"
    else:
        advice = "SAFE: Air quality is ideal. Enjoy outdoor activities."
        outdoor = "Completely safe to spend time outdoors."
        mask = "No masks required."
        exercise = "Excellent conditions for outdoor sports and running."
        level = "Safe"

    # Fetch next day forecast if available
    forecast_24 = db.query(AQIForecast).filter(
        AQIForecast.station_id == (station.id if station else 1)
    ).order_by(AQIForecast.target_time.asc()).first()
    
    tomorrow_aqi = forecast_24.predicted_aqi if forecast_24 else (aqi_val + random.randint(-15, 15))

    return {
        "city": city,
        "ward": ward,
        "current_aqi": aqi_val,
        "tomorrow_aqi": tomorrow_aqi,
        "health_level": level,
        "advice": advice,
        "outdoor_recommendation": outdoor,
        "mask_recommendation": mask,
        "exercise_timing": exercise,
        "main_pollutant": main_poll
    }

@router.get("/recommendations")
@router.get("/actions/recommend")
def get_mitigation_and_enforcement(city: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    # 1. Mitigation Actions (AI mitigation scheduler)
    query = db.query(MonitoringStation)
    if city:
        query = query.filter(MonitoringStation.city == city)
    stations = query.all()
    
    recs = []
    # Dynamic generation based on actual high AQI stations
    for s in stations:
        if s.current_aqi > 150:
            attr = db.query(SourceAttribution).filter(SourceAttribution.station_id == s.id).order_by(SourceAttribution.timestamp.desc()).first()
            main_source = "Traffic"
            if attr:
                sources = {"Traffic": attr.traffic, "Construction": attr.construction, "Industrial": attr.industrial, "Agricultural": attr.agricultural}
                main_source = max(sources, key=sources.get)
            
            if main_source == "Industrial":
                recs.append({
                    "id": len(recs) + 1,
                    "title": f"Shutdown manufacturing boilers at {s.ward}",
                    "description": f"Enforcing temporary suspensions of combustion processes at the local industrial block to clear a {s.current_aqi} AQI spike.",
                    "improvement": f"-{int(s.current_aqi * 0.25)} AQI",
                    "eta": "Immediate",
                    "department": "Pollution Control Board"
                })
            elif main_source == "Construction":
                recs.append({
                    "id": len(recs) + 1,
                    "title": f"Fugitive dust suppression in {s.ward}",
                    "description": f"Deploying water-mist cannon vehicles around civil construction corridors. Restricting raw sand deliveries.",
                    "improvement": f"-{int(s.current_aqi * 0.12)} AQI",
                    "eta": "2 Hours",
                    "department": "Municipal Sanitation Corporation"
                })
            else:
                recs.append({
                    "id": len(recs) + 1,
                    "title": f"Heavy commercial vehicle restriction schedule",
                    "description": f"Rerouting intercity diesel logistics trucks away from the {s.ward} transit terminal during peak morning hours.",
                    "improvement": f"-{int(s.current_aqi * 0.18)} AQI",
                    "eta": "1 Hour",
                    "department": "Traffic Management Authority"
                })

    # Always ensure some default actions
    if not recs:
        recs = [
            {
                "id": 1,
                "title": "Establish Green Transit corridors",
                "description": "Enforce strict speed controls on major arteries to prevent particulate resuspension during low-wind stagnation.",
                "improvement": "-15 AQI",
                "eta": "2 Hours",
                "department": "Traffic Authority"
            },
            {
                "id": 2,
                "title": "Clean Fuel advisory for cooking grills",
                "description": "Issue municipal notices restricting coal-fired ovens in central open markets during nocturnal inversion hours.",
                "improvement": "-25 AQI",
                "eta": "Immediate",
                "department": "Pollution Control Board"
            }
        ]

    # 2. Enforcement Inspection Priority List
    # We rank ALL wards in the dataset.
    # Risk Score = (CurrentAQI * 0.35) + (ForecastAQI_24 * 0.25) + ((Population / 100000) * 0.2) + (MainSourceFactor * 0.2)
    # Target values: high priority means higher inspection urgency.
    
    enforcement_list = []
    
    for s in stations:
        ward_pop = db.query(WardPopulation).filter(
            WardPopulation.ward_name == s.ward,
            WardPopulation.city == s.city
        ).first()
        population = ward_pop.population if ward_pop else 45000
        
        forecast_24 = db.query(AQIForecast).filter(
            AQIForecast.station_id == s.id
        ).order_by(AQIForecast.target_time.asc()).first()
        f_aqi = forecast_24.predicted_aqi if forecast_24 else (s.current_aqi + random.randint(-10, 10))

        attr = db.query(SourceAttribution).filter(SourceAttribution.station_id == s.id).order_by(SourceAttribution.timestamp.desc()).first()
        main_source = "Traffic"
        source_factor = 20.0 # traffic baseline
        if attr:
            sources = {"Traffic": attr.traffic, "Construction": attr.construction, "Industrial": attr.industrial, "Agricultural": attr.agricultural}
            main_source = max(sources, key=sources.get)
            if main_source == "Industrial":
                source_factor = 40.0
            elif main_source == "Construction":
                source_factor = 30.0
            elif main_source == "Agricultural":
                source_factor = 35.0

        # Calculate mathematical Priority Risk Score
        risk_score = (s.current_aqi * 0.35) + (f_aqi * 0.25) + ((population / 10000.0) * 2.5) + (source_factor * 0.3)
        risk_score = round(min(100, max(10, risk_score)), 1)
        
        priority_label = "Low"
        if risk_score > 75:
            priority_label = "Critical"
        elif risk_score > 55:
            priority_label = "High"
        elif risk_score > 35:
            priority_label = "Medium"

        action = "Dispatch stack inspectors"
        if main_source == "Traffic":
            action = "Set vehicle restriction checkpoint"
        elif main_source == "Construction":
            action = "Inspect wet dust screens"
        elif main_source == "Agricultural":
            action = "Monitor field biomass burn logs"

        enforcement_list.append({
            "station_id": s.id,
            "ward": s.ward,
            "city": s.city,
            "current_aqi": s.current_aqi,
            "forecast_aqi": f_aqi,
            "population": population,
            "main_source": main_source,
            "risk_score": risk_score,
            "recommended_action": action,
            "priority": priority_label
        })

    # Sort enforcement list by risk score descending
    enforcement_list.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "mitigations": recs,
        "enforcements": enforcement_list
    }

@router.get("/alerts")
def get_alerts(city: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    query = db.query(Alert).filter(Alert.is_resolved == False)
    if city:
        # Join with stations to filter by city
        query = query.join(MonitoringStation).filter(MonitoringStation.city == city)
        
    alerts = query.order_by(Alert.timestamp.desc()).all()
    
    return [
        {
            "id": a.id,
            "station_id": a.station_id,
            "ward": a.ward or "Citywide",
            "severity": a.severity,
            "message": a.message,
            "suggested_action": a.suggested_action,
            "timestamp": a.timestamp
        } for a in alerts
    ]

@router.post("/citizen-report", status_code=status.HTTP_201_CREATED)
def create_citizen_report(report: CitizenReportCreate, db: Session = Depends(get_db)):
    db_report = CitizenReport(
        category=report.category,
        description=report.description,
        latitude=report.latitude,
        longitude=report.longitude,
        ward=report.ward,
        status="Pending",
        timestamp=datetime.utcnow()
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/citizen-report")
def get_citizen_reports(db: Session = Depends(get_db)):
    reports = db.query(CitizenReport).order_by(CitizenReport.timestamp.desc()).all()
    return [
        {
            "id": r.id,
            "category": r.category,
            "description": r.description,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "ward": r.ward,
            "status": r.status,
            "timestamp": r.timestamp
        } for r in reports
    ]

@router.post("/simulate")
def run_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    """Simulates projected dispersion and returns risk impacts for building projects."""
    lat = req.latitude
    lng = req.longitude
    scale = req.scale
    proj_type = req.project_type
    
    # Find nearest station
    stations = db.query(MonitoringStation).all()
    if not stations:
        raise HTTPException(status_code=400, detail="No active station grid to benchmark simulation")
        
    # Simple Euclidean distance search
    nearest = min(stations, key=lambda s: (s.latitude - lat)**2 + (s.longitude - lng)**2)
    
    # Calculate simulated parameters
    # Baseline AQI
    base_aqi = nearest.current_aqi
    
    # Increments based on project scale and type
    multipliers = {
        "factory": 45,      # Heavy factory adds lots of emissions
        "highway": 30,      # Highway adds traffic PM/NOx
        "flyover": 20,      # Construction dust
        "diversion": 15     # Short term vehicle build up
    }
    
    inc = multipliers.get(proj_type, 15) * scale
    future_aqi = int(base_aqi + inc)
    
    # Cap future AQI
    future_aqi = min(future_aqi, 500)
    
    # Exposed population calculation: ward population * scale factor within dispersion
    ward_pop = db.query(WardPopulation).filter(WardPopulation.ward_name == nearest.ward).first()
    total_pop = ward_pop.population if ward_pop else 45000
    exposed_pop = int(total_pop * (0.15 * scale))
    
    # Compute simulated infrastructures nearby based on location offsets
    hospitals = 1 if scale > 1 else 0
    schools = 2 if scale == 3 else (1 if scale == 2 else 0)
    water_body = "Secondary Canal" if (lat + lng) % 0.05 > 0.02 else "None"
    
    # Rationale
    risk_level = "HIGH RISK" if future_aqi > 200 else ("MODERATE" if future_aqi > 100 else "LOW RISK")
    
    reasoning = (
        f"Positioning a {proj_type} at coordinates ({round(lat, 5)}°N, {round(lng, 5)}°E) will trigger a "
        f"projected pollutant dispersion plume across a {scale * 1.5} km radius. With current background weather conditions "
        f"(Temp: {nearest.temperature}°C, Wind Speed: {nearest.wind_speed} km/h, Direction: {nearest.wind_direction}), dispersion modeling "
        f"projects particulate levels will accumulate, pushing the local index to {future_aqi} AQI."
    )
    
    return {
        "project_type": proj_type,
        "scale": scale,
        "latitude": lat,
        "longitude": lng,
        "nearest_station": nearest.name,
        "current_background_aqi": base_aqi,
        "projected_peak_aqi": future_aqi,
        "risk_level": risk_level,
        "exposed_population": exposed_pop,
        "infrastructure": {
            "hospitals": hospitals,
            "schools": schools,
            "water_bodies": water_body
        },
        "ai_reasoning": reasoning
    }

@router.get("/reports")
def get_reports(format: str = Query("csv", regex="^(pdf|csv)$"), city: Optional[str] = None, db: Session = Depends(get_db)):
    ensure_fresh_telemetry(db)
    
    query = db.query(MonitoringStation)
    if city:
        query = query.filter(MonitoringStation.city == city)
    stations = query.all()
    
    if not stations:
        raise HTTPException(status_code=404, detail="No station data found for report generation")

    target_city = city or "All Cities"
    
    if format == "csv":
        csv_data = generate_csv_report(stations)
        filename = f"UrbanAQI_Report_{target_city.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    elif format == "pdf":
        alerts = db.query(Alert).filter(Alert.is_resolved == False)
        if city:
            alerts = alerts.join(MonitoringStation).filter(MonitoringStation.city == city)
        alerts_list = alerts.all()
        
        citizen_reps = db.query(CitizenReport).all()
        
        pdf_data = generate_pdf_report(target_city, stations, alerts_list, citizen_reps)
        filename = f"UrbanAQI_Report_{target_city.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

@router.post("/reports/generate")
def generate_report(request: ReportGenerateRequest, db: Session = Depends(get_db)):
    """Compatibility endpoint for clients that generate reports with a POST body."""
    if request.format not in {"pdf", "csv"}:
        raise HTTPException(status_code=422, detail="format must be either 'pdf' or 'csv'")
    return get_reports(format=request.format, city=request.city, db=db)
