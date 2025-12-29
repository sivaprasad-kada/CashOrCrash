import api from "./api";

const API = "/leaderboard";

export const fetchLeaderboard = () => api.get(API);
