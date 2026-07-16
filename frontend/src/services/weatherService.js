import { apiRequest } from "./api";

export const weatherService = {
  async getWeatherSummary(city = "") {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return apiRequest(`/weather${query}`);
  }
};
