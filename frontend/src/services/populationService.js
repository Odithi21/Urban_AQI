import { apiRequest } from "./api";

export const populationService = {
  async getEnforcementDetails(city = "") {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return apiRequest(`/recommendations${query}`);
  },

  async getCitizenAdvisory(city, ward) {
    const query = `?city=${encodeURIComponent(city)}&ward=${encodeURIComponent(ward)}`;
    return apiRequest(`/advisory${query}`);
  }
};
