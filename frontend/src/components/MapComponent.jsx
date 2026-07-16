import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet asset path issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Helper to determine color based on AQI value
const getAQIColor = (aqi) => {
  if (aqi > 300) return "#ef4444"; // severe (red)
  if (aqi > 200) return "#f97316"; // dangerous (orange)
  if (aqi > 100) return "#eab308"; // unhealthy (yellow)
  if (aqi > 50) return "#3b82f6";  // moderate (blue)
  return "#22c55e";                 // safe (green)
};

// Create a premium custom pulsing indicator icon
const createStationIcon = (aqi) => {
  const color = getAQIColor(aqi);
  return L.divIcon({
    className: "custom-station-icon",
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.25; transform: scale(1);" class="map-glow-pulse"></span>
        <span style="position: absolute; width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 2px solid #090d16; box-shadow: 0 0 10px ${color};"></span>
        <span style="position: absolute; top: -14px; font-size: 9px; font-weight: bold; background: #111827; color: ${color}; padding: 1px 4px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">
          ${aqi}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Create a marker for citizen reports
const createCitizenReportIcon = (category) => {
  return L.divIcon({
    className: "custom-citizen-icon",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #8b5cf6; border: 2px solid #ffffff; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 8px #8b5cf6;"></div>
        <span style="position: absolute; top: -12px; font-size: 8px; background: #0f172a; color: #a78bfa; padding: 1px 3px; border-radius: 3px; border: 1px solid rgba(139, 92, 246, 0.3); white-space: nowrap;">
          ⚠️ Rep
        </span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Create infrastructure icon overlays
const createInfraIcon = (type) => {
  const emoji = type === "hospital" ? "🏥" : (type === "school" ? "🏫" : "🏭");
  return L.divIcon({
    className: "custom-infra-icon",
    html: `<div style="font-size: 20px; line-height: 1; text-shadow: 0 0 4px rgba(0,0,0,0.6);">${emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to dynamically change map viewpoint
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Map Click Handler for Planning & Simulation mode
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapComponent({
  stations = [],
  citizenReports = [],
  selectedStation = null,
  onSelectStation = null,
  simulationCoords = null,
  simulationRadius = 0,
  onMapClick = null,
  cityCenter = [17.385044, 78.486671], // default Hyderabad
  zoom = 12
}) {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl border border-border bg-surface shadow-glass">
      <MapContainer
        center={cityCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={cityCenter} zoom={zoom} />
        
        {/* Dark theme styled tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />

        {/* Listen for map clicks */}
        <MapEventsHandler onMapClick={onMapClick} />

        {/* Render Station Markers */}
        {stations.map((s) => (
          <Marker
            key={`station-${s.id}`}
            position={[s.latitude, s.longitude]}
            icon={createStationIcon(s.current_aqi)}
            eventHandlers={{
              click: () => {
                if (onSelectStation) onSelectStation(s);
              },
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 text-slate-800 font-sans">
                <h4 className="font-bold text-sm leading-tight text-slate-900">{s.name}</h4>
                <p className="text-[10px] text-slate-500 mb-1">{s.ward}, {s.city}</p>
                <div className="flex justify-between items-center mt-2 border-t pt-2 gap-4">
                  <span className="text-xs">AQI: <strong style={{ color: getAQIColor(s.current_aqi) }}>{s.current_aqi}</strong></span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Temp: {s.temperature}°C</span>
                </div>
                {onSelectStation && (
                  <button
                    onClick={() => onSelectStation(s)}
                    className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded transition-colors text-center"
                  >
                    Inspect Telemetry
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Citizen Report Pin Markers */}
        {citizenReports.map((r) => (
          <Marker
            key={`citizen-rep-${r.id}`}
            position={[r.latitude, r.longitude]}
            icon={createCitizenReportIcon(r.category)}
          >
            <Popup>
              <div className="p-2 text-slate-800 font-sans max-w-xs">
                <span className="text-[9px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Citizen Incident
                </span>
                <h4 className="font-bold text-sm mt-1 text-slate-900">{r.category}</h4>
                <p className="text-[11px] mt-1 text-slate-600 leading-tight">{r.description}</p>
                <div className="flex justify-between items-center mt-2 border-t pt-2 text-[10px] text-slate-500">
                  <span>Ward: {r.ward}</span>
                  <span>Status: <strong className="text-amber-600">{r.status}</strong></span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render nearby simulated infrastructure overlays for active stations */}
        {stations.map((s) => {
          // If station AQI is high, display mock infrastructure overlays for mapping visualization
          if (s.current_aqi > 150) {
            const hospitalOffset = [s.latitude + 0.005, s.longitude - 0.006];
            const schoolOffset = [s.latitude - 0.004, s.longitude + 0.005];
            const industrialOffset = [s.latitude + 0.008, s.longitude + 0.008];
            
            return (
              <React.Fragment key={`infra-${s.id}`}>
                <Marker position={hospitalOffset} icon={createInfraIcon("hospital")}>
                  <Popup>
                    <div className="text-slate-800 p-1 font-sans text-xs">
                      🏥 <strong>City Pediatric Care</strong><br/>
                      Sensitive Health Zone (Within {s.ward} sector)
                    </div>
                  </Popup>
                </Marker>
                <Marker position={schoolOffset} icon={createInfraIcon("school")}>
                  <Popup>
                    <div className="text-slate-800 p-1 font-sans text-xs">
                      🏫 <strong>Public Model High School</strong><br/>
                      Vulnerable Population Zone
                    </div>
                  </Popup>
                </Marker>
                <Marker position={industrialOffset} icon={createInfraIcon("factory")}>
                  <Popup>
                    <div className="text-slate-800 p-1 font-sans text-xs">
                      🏭 <strong>Industrial Boiler Complex</strong><br/>
                      Secondary Emission Source
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          }
          return null;
        })}

        {/* Render active simulation development planning plume circles */}
        {simulationCoords && (
          <>
            {/* Plume center marker */}
            <Marker position={[simulationCoords.lat, simulationCoords.lng]} icon={createInfraIcon("factory")}>
              <Popup>
                <div className="text-slate-800 p-1 font-sans text-xs">
                  🏭 <strong>Proposed Project Core</strong><br/>
                  Coordinates: {simulationCoords.lat.toFixed(5)}°N, {simulationCoords.lng.toFixed(5)}°E
                </div>
              </Popup>
            </Marker>
            
            {/* Dispersion Radius rings (inner and outer) */}
            <Circle
              center={[simulationCoords.lat, simulationCoords.lng]}
              radius={simulationRadius}
              pathOptions={{
                fillColor: "#ef4444",
                fillOpacity: 0.2,
                color: "#ef4444",
                weight: 1.5,
                dashArray: "4 4"
              }}
            />
            <Circle
              center={[simulationCoords.lat, simulationCoords.lng]}
              radius={simulationRadius * 1.8}
              pathOptions={{
                fillColor: "#f97316",
                fillOpacity: 0.08,
                color: "#f97316",
                weight: 1,
                dashArray: "2 6"
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
