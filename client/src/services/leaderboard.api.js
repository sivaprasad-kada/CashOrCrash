import axios from "axios";

import { API_BASE_URL } from "../config";

const API = `${API_BASE_URL}/api/leaderboard`;

export const fetchLeaderboard = () => axios.get(API);
