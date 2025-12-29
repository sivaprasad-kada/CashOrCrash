// [NEW] Centralized Configuration
// Use VITE_API_URL if set, otherwise default to localhost
// For single-service deployment, relative paths often work, but having a full URL is safer for Socket.io
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
