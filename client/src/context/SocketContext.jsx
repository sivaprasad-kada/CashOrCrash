import { createContext, useContext, useEffect } from "react";
import { socket } from "../services/socket.service";
import { useGame } from "./GameContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const {
    setQuestionResults,
    setBidState,
    setFlipAll,
    setShowOnlySelected,
    setRevealQuestion,
    setAdminBalance,
    refreshState // [NEW] Fetch from DB
  } = useGame();

  useEffect(() => {
    /* HANDLERS */
    const handleQuestionLocked = ({ questionNumber }) => {
      // Refresh DB state to confirm lock logic + Results
      refreshState();

      // UI Flow Reset
      setQuestionResults(prev => ({
        ...prev,
        [questionNumber]: "locked"
      }));

      setTimeout(() => {
        setFlipAll(false);
        setShowOnlySelected(false);
        setRevealQuestion(false);
        setBidState({ questionId: null, amount: null, confirmed: false });
      }, 800);
    };

    const handleTeamBalanceUpdated = () => {
      refreshState(); // Fetch fresh data from DB
    };

    const handleAdminBalanceUpdated = () => {
      refreshState(); // Fetch fresh data from DB
    };

    const handleSugarCandyApplied = () => {
      refreshState();
    };

    const handleTeamUpdate = () => {
      refreshState();
    };

    socket.on("question-locked", handleQuestionLocked);
    socket.on("team-balance-updated", handleTeamBalanceUpdated);
    socket.on("admin-balance-updated", handleAdminBalanceUpdated);
    socket.on("sugar-candy-applied", handleSugarCandyApplied);
    socket.on("teamUpdate", handleTeamUpdate);

    return () => {
      socket.off("question-locked", handleQuestionLocked);
      socket.off("team-balance-updated", handleTeamBalanceUpdated);
      socket.off("admin-balance-updated", handleAdminBalanceUpdated);
      socket.off("sugar-candy-applied", handleSugarCandyApplied);
      socket.off("teamUpdate", handleTeamUpdate);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
