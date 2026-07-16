import { apiRequest } from "./api";

export const aqiService = {
  async getCurrentTelemetry(city = "") {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return apiRequest(`/current-aqi${query}`);
  },

  async getForecast(city = "", ward = "", stationId = null) {
    let query = "";
    const params = [];
    if (stationId) params.push(`station_id=${stationId}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (ward) params.push(`ward=${encodeURIComponent(ward)}`);
    if (params.length > 0) query = `?${params.join("&")}`;
    
    return apiRequest(`/forecast${query}`);
  },

  async getHotspots(city = "") {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return apiRequest(`/hotspots${query}`);
  },

  async getAlerts(city = "") {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return apiRequest(`/alerts${query}`);
  },

  async submitCitizenReport(reportData) {
    return apiRequest("/citizen-report", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  },

  async getCitizenReports() {
    return apiRequest("/citizen-report");
  },

  async runSimulation(simData) {
    return apiRequest("/simulate", {
      method: "POST",
      body: JSON.stringify(simData),
    });
  },

  async downloadReport(format, city = "") {
    const query = `?format=${format}${city ? `&city=${encodeURIComponent(city)}` : ""}`;
    const blob = await apiRequest(`/reports${query}`, { responseType: "blob" });
    
    // Trigger browser download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `UrbanAQI_Report_${city || "All"}_${new Date().toISOString().slice(0, 10)}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
