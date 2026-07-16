const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    // For file downloads (reports), return response or blob
    if (options.responseType === "blob") {
      return await response.blob();
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error);
    throw error;
  }
}
