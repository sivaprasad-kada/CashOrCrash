import { createContext, useContext, useEffect } from "react";
import { socket } from "../services/socket.service";
import { useGame } from "./GameContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const {
    setQuestionResults,
    setTeams,
    setBidState,
    setFlipAll,
    setShowOnlySelected,
    setRevealQuestion
  } = useGame();

  useEffect(() => {
    const handleQuestionLocked = ({
      questionId,
      result,
      teamId,
      balance
    }) => {
      /* 1️⃣ Lock question globally */
      setQuestionResults(prev => ({
        ...prev,
        [questionId]: result
      }));

      /* 2️⃣ Update correct team balance (_id FIX) */
      setTeams(prev =>
        prev.map(team =>
          team._id === teamId
            ? { ...team, balance }
            : team
        )
      );

      /* 3️⃣ RESET GAME FLOW */
      setTimeout(() => {
        setFlipAll(false);
        setShowOnlySelected(false);
        setRevealQuestion(false);
        setBidState({
          questionId: null,
          amount: null,
          confirmed: false
        });
      }, 800); // allow user to see color
    };

    socket.on("questionLocked", handleQuestionLocked);

    return () => {
      socket.off("questionLocked", handleQuestionLocked);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
