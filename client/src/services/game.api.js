import api from "./api";

const GAME_BASE = "/game";
const TEAM_BASE = "/teams";

export const submitAnswer = (payload) =>
  api.post(`${GAME_BASE}/answer`, payload);

export const fetchTeams = () =>
  api.get(TEAM_BASE);

export const fetchLeaderboard = () =>
  api.get(`${TEAM_BASE}/leaderboard`);

