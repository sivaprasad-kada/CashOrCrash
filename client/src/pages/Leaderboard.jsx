import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../services/game.api";
import { useNavigate } from "react-router-dom";
import "../styles/leaderboard.css";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await fetchLeaderboard();
      setTeams(res.data);
    } catch (err) {
      console.error("Leaderboard load failed", err);
    }
  };

  const getRankClass = (index) => {
    if (index === 0) return "gold";
    if (index === 1) return "silver";
    if (index === 2) return "bronze";
    return "";
  };

  return (
    <div className="leaderboard-page">
      <h1 className="leaderboard-title">🏆 Top 10 Teams</h1>

      <div className="leaderboard-grid">
        {teams.map((team, index) => (
          <div
            key={team._id}
            className={`team-card ${getRankClass(index)}`}
          >
            <div className="team-rank">#{index + 1}</div>

            <div className="team-avatar">
              {team.name.charAt(0)}
            </div>

            <div className="team-name">{team.name}</div>
            <div className="team-room" style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>
              📍 {team.roomId?.name || 'Lobby'}
            </div>
            <div className="team-balance">₹ {team.balance}</div>
          </div>
        ))}
      </div>

      {/* Back to Game */}
      <button
        className="back-to-game-fab"
        onClick={() => navigate("/game")}
      >
        🎮
      </button>
    </div>
  );
}
