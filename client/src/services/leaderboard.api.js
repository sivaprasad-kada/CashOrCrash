import api from "./api";

const API = "/api/leaderboard";

export const fetchLeaderboard = () => api.get(API);
