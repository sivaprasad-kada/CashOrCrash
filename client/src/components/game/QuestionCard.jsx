import { useGame } from "../../context/GameContext";

export default function QuestionCard({ questionId }) {
  const { bidState } = useGame();

  const isSelected = bidState.confirmed && bidState.questionId === questionId;

  return (
    <div className="question-box">
      <div className="question-card" style={{ opacity: isSelected ? 0 : 1 }}>
        <div className="question-no">Q{questionId}</div>
        <div className="lock-icon">🔒</div>
      </div>
    </div>
  );
}
