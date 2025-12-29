import axios from 'axios';

// Create a centralized axios instance
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`, // centralized /api prefix
    withCredentials: true, // Maintain cookie/session support
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
