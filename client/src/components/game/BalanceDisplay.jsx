import { useGame } from "../../context/GameContext";

export default function BalanceDisplay() {
  const { activeTeam } = useGame();

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
      <div className="balance-amount">₹{activeTeam.balance}</div>
    </div>
  );
}
