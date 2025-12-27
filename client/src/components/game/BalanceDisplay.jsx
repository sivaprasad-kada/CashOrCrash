import { useGame } from "../../context/GameContext";

export default function BalanceDisplay() {
  const { activeTeam, refreshTeamBalance } = useGame();

  if (!activeTeam) {
    return (
      <div className="balance-box glass">
        <div className="balance-title">Balance</div>
        <div className="balance-amount">₹0</div>
      </div>
    );
  }

  return (
    <div className="balance-box glass">
      <div className="balance-title">Balance</div>
      <div className="balance-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        ₹{activeTeam.balance.toLocaleString()}
        <button
          onClick={() => refreshTeamBalance(activeTeam._id)}
          title="Refresh Team Balance"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          ↻
        </button>
      </div>
    </div>
  );
}
