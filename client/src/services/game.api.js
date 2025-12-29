import axios from "axios";

import { API_BASE_URL } from "../config";

const GAME_API = `${API_BASE_URL}/api/game`;
const TEAM_API = `${API_BASE_URL}/api/teams`;

export const submitAnswer = (payload) =>
  axios.post(`${GAME_API}/answer`, payload);

export const fetchTeams = () =>
  axios.get(TEAM_API);

export const fetchLeaderboard = () =>
  axios.get(`${TEAM_API}/leaderboard`);
