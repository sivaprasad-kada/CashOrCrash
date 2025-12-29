import api from "./api";

const GAME_BASE = "/api/game";
const TEAM_BASE = "/api/teams";

export const submitAnswer = (payload) =>
  api.post(`${GAME_BASE}/answer`, payload);

export const fetchTeams = () =>
  api.get(TEAM_BASE);

export const fetchLeaderboard = () =>
  api.get(`${TEAM_BASE}/leaderboard`);

