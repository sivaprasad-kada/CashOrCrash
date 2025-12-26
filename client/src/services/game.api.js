import axios from "axios";

const GAME_API = "http://localhost:5000/api/game";
const TEAM_API = "http://localhost:5000/api/teams";

export const submitAnswer = (payload) =>
  axios.post(`${GAME_API}/answer`, payload);

export const fetchTeams = () =>
  axios.get(TEAM_API);

export const fetchLeaderboard = () =>
  axios.get(`${TEAM_API}/leaderboard`);
