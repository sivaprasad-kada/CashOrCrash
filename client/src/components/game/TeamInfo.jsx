import { useNavigate } from "react-router-dom";
import { useGame } from "../../context/GameContext";

export default function TeamInfo() {
  const { activeTeam } = useGame();
  const navigate = useNavigate();

  if (!activeTeam) {
    return (
      <div className="team-info">
        <p>Loading team...</p>
      </div>
    );
  }

  return (
    <div className="team-info">
      <h3>{activeTeam.name}</h3>
      <div className="team-stats-row" style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.9rem', color: '#aaa' }}>
        <span>🪙 {activeTeam.unityTokens || 0} Unity Tokens</span>
        <span>🍬 {activeTeam.sugarCandy || 0} Sugar Candy</span>
      </div>
      <button
        className="btn-glass"
        style={{ marginTop: '10px', fontSize: '0.8rem', padding: '5px 10px', background: 'rgba(255,105,180,0.2)', border: '1px solid hotpink', color: 'hotpink', cursor: 'pointer' }}
        onClick={() => navigate(`/sugar-candy/${activeTeam._id}`)}
      >
        🍭 OPEN SUGAR CANDY SHOP
      </button>
    </div>
  );
}
