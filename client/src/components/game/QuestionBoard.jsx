import { useGame } from "../../context/GameContext";
import QuestionCard from "./QuestionCard";

export default function QuestionBoard() {
  const { questions, bidState, showOnlySelected, questionResults } = useGame();

  return (
    <div className="question-board">
      {questions.map(q => {
        // If question is already answered/locked, do not show it
        if (questionResults[q.id]) return null;

        return (
          <QuestionCard
            key={q.id}
            questionId={q.id}
          />
        );
      })}
    </div>
  );
}
