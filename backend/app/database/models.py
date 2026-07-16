from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class MonitoringStation(Base):
    __tablename__ = "monitoring_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    city = Column(String, index=True)
    ward = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    
    current_aqi = Column(Integer, default=0)
    temperature = Column(Float, default=0.0)
    humidity = Column(Float, default=0.0)
    wind_speed = Column(Float, default=0.0)
    wind_direction = Column(String, default="N")
    main_pollutant = Column(String, default="PM2.5")
    last_updated = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    history = relationship("AQIHistory", back_populates="station", cascade="all, delete-orphan")
    forecasts = relationship("AQIForecast", back_populates="station", cascade="all, delete-orphan")
    attributions = relationship("SourceAttribution", back_populates="station", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="station", cascade="all, delete-orphan")


class AQIHistory(Base):
    __tablename__ = "aqi_history"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"))
    aqi = Column(Integer)
    pm25 = Column(Float, default=0.0)
    pm10 = Column(Float, default=0.0)
    no2 = Column(Float, default=0.0)
    so2 = Column(Float, default=0.0)
    co = Column(Float, default=0.0)
    o3 = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    station = relationship("MonitoringStation", back_populates="history")


class AQIForecast(Base):
    __tablename__ = "aqi_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"))
    target_time = Column(DateTime)
    predicted_aqi = Column(Integer)
    confidence_score = Column(Float)  # Percentage, e.g. 92.5
    main_pollutant = Column(String)
    rationale = Column(Text)  # Dynamic AI reasoning

    station = relationship("MonitoringStation", back_populates="forecasts")


class SourceAttribution(Base):
    __tablename__ = "source_attributions"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    traffic = Column(Float)  # percentage
    construction = Column(Float)  # percentage
    industrial = Column(Float)  # percentage
    weather_factor = Column(Float)  # percentage (e.g. stagnation/humidity/wind)
    agricultural = Column(Float)  # percentage
    explanation = Column(Text)  # AI attribution explanation

    station = relationship("MonitoringStation", back_populates="attributions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"), nullable=True)
    ward = Column(String, nullable=True)
    severity = Column(String)  # Info, Warning, Unhealthy, Dangerous, Severe
    message = Column(Text)
    suggested_action = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_resolved = Column(Boolean, default=False)

    station = relationship("MonitoringStation", back_populates="alerts")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)  # Garbage burning, construction dust, industrial smoke, vehicle emissions, illegal dumping
    description = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    ward = Column(String)
    status = Column(String, default="Pending")  # Pending, In Progress, Resolved
    timestamp = Column(DateTime, default=datetime.utcnow)


class WardPopulation(Base):
    __tablename__ = "ward_population"

    id = Column(Integer, primary_key=True, index=True)
    ward_name = Column(String, index=True)
    city = Column(String, index=True)
    population = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
