import TeamSelector from "./TeamSelector";
import TeamInfo from "./TeamInfo";
import BalanceDisplay from "./BalanceDisplay";
import LifelineDisplay from "./LifelineDisplay";
import QuestionNumberGrid from "./QuestionNumberGrid";

export default function SidePanel() {
  return (
    <div className="glass side-panel">
      <TeamSelector />
      <TeamInfo />
      <BalanceDisplay />
      <LifelineDisplay />
      <QuestionNumberGrid />
    </div>
  );
}
