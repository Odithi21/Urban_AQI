import { apiRequest } from "./api";

export const mapService = {
  async getSourceAttribution(stationId = null, city = "", ward = "") {
    let query = "";
    const params = [];
    if (stationId) params.push(`station_id=${stationId}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (ward) params.push(`ward=${encodeURIComponent(ward)}`);
    if (params.length > 0) query = `?${params.join("&")}`;
    
    return apiRequest(`/source-attribution${query}`);
  }
};
