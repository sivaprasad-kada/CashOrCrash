import { useGame } from "../../context/GameContext";

export default function TeamInfo() {
  const { activeTeam } = useGame();

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
      {/* Balance is handled by BalanceDisplay separately usually, but good to have here too if requested? 
          User said "Game page shows balance...". BalanceDisplay component exists. 
          We'll keep this simple. */}
    </div>
  );
}
