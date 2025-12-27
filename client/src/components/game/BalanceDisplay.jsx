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
            border: '1px solid var(--glass-border)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            marginLeft: '5px'
          }}
        >
          ↻
        </button>
      </div>
    </div>
  );
}
