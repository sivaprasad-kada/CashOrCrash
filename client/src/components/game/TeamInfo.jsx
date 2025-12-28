import { useNavigate } from "react-router-dom";
import { useGame } from "../../context/GameContext";

export default function TeamInfo() {
  const { activeTeam, refreshTeamBalance } = useGame();
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
      <div className="team-stats-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '0.9rem', color: '#aaa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🪙 {activeTeam.unityTokens || 0} Unity Tokens</span>
          <button
            onClick={() => refreshTeamBalance(activeTeam._id)}
            title="Refresh Tokens"
            style={{
              background: 'transparent', border: '1px solid #aaa', color: '#aaa', borderRadius: '50%',
              width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >↻</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🍬 {activeTeam.sugarCandyAddCount || 0}/2 Used</span>
          <button
            onClick={() => refreshTeamBalance(activeTeam._id)}
            title="Refresh Candy"
            style={{
              background: 'transparent', border: '1px solid #aaa', color: '#aaa', borderRadius: '50%',
              width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >↻</button>
        </div>
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
