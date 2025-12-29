// This file is deprecated in favor of using the centralized api service.
// However, we keep the constant export for any non-axios usage if necessary,
// but strongly encourage checking src/services/api.js

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
