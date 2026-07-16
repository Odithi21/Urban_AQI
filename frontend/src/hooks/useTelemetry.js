import { useState, useEffect, useCallback } from "react";
import { aqiService } from "../services/aqiService";
import { weatherService } from "../services/weatherService";
import { populationService } from "../services/populationService";

export function useTelemetry(city) {
  const [telemetry, setTelemetry] = useState(null);
  const [weather, setWeather] = useState(null);
  const [enforcements, setEnforcements] = useState([]);
  const [mitigations, setMitigations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [telemetryData, weatherData, enforcementData, alertsData] = await Promise.all([
        aqiService.getCurrentTelemetry(city),
        weatherService.getWeatherSummary(city),
        populationService.getEnforcementDetails(city),
        aqiService.getAlerts(city)
      ]);
      
      setTelemetry(telemetryData);
      setWeather(weatherData);
      setEnforcements(enforcementData.enforcements || []);
      setMitigations(enforcementData.mitigations || []);
      setAlerts(alertsData || []);
    } catch (err) {
      console.error("Failed to fetch dashboard telemetry data:", err);
      setError(err.message || "An error occurred while fetching telemetry data.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchAllTelemetry();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAllTelemetry, 120000);
    return () => clearInterval(interval);
  }, [fetchAllTelemetry]);

  return {
    telemetry,
    weather,
    enforcements,
    mitigations,
    alerts,
    loading,
    error,
    refresh: fetchAllTelemetry
  };
}
