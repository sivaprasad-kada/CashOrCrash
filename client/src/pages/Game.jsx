import "../styles/game.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useSocket } from "../context/SocketContext";

import SidePanel from "../components/game/SidePanel";
import QuestionBoard from "../components/game/QuestionBoard";
import QuestionOverlay from "../components/game/QuestionOverlay";
import BidPanel from "../components/game/BidPanel";
import FeedbackOverlay from "../components/game/FeedbackOverlay";

export default function Game() {
  const navigate = useNavigate();
  const {
    isGameActive, adminBalance, adminName, setTeams, setAdminBalance, activeTeam,
    hasActiveAdmin, isAdminLoading, logoutAdmin, setQuestionResults, adminRoomId
  } = useGame();
  const socket = useSocket();

  // [NEW] Route Protection
  useEffect(() => {
    if (!isAdminLoading && !hasActiveAdmin) {
      navigate("/admin");
    }
  }, [isAdminLoading, hasActiveAdmin, navigate]);

  // Socket Listeners for Real-time Updates
  useEffect(() => {
    if (!socket) return;

    socket.on("TEAM_UPDATE", (updatedTeam) => {
      setTeams(prev => prev.map(t => t._id === updatedTeam._id ? updatedTeam : t));
    });

    socket.on("ADMIN_BALANCE_UPDATE", ({ balance, adminId }) => {
      setAdminBalance(balance);
    });

    socket.on("QUESTION_LOCKED", ({ roomId, questionId, result }) => {
      const currentRoomId = adminRoomId || activeTeam?.roomId;

      // Strict Room Check
      if (currentRoomId && String(currentRoomId) === String(roomId)) {
        console.log(`[GAME] Locking Question ${questionId} for Room ${roomId}`);
        setQuestionResults(prev => ({
          ...prev,
          [questionId]: result || "locked"
        }));
      }
    });

    return () => {
      socket.off("TEAM_UPDATE");
      socket.off("ADMIN_BALANCE_UPDATE");
      socket.off("QUESTION_LOCKED");
    };
  }, [socket, setTeams, setAdminBalance, setQuestionResults, adminRoomId, activeTeam]);

  if (isAdminLoading) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Checking Permissions...</h2>
      </div>
    );
  }

  if (!isGameActive) {
    return (
      <div className="game-locked-screen" style={{
        height: '100vh', width: '100vw', background: '#000', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <h1>🚧 ARENA LOCKED 🚧</h1>
        <p>Waiting for Admin to START GAME...</p>
        <button onClick={() => navigate("/")} style={{ marginTop: '20px', padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#aaa', cursor: 'pointer' }}>
          Back to Entrance
        </button>
      </div>
    );
  }

  return (
    <div className="game-layout">
      {/* ADMIN TOP BAR */}
      <div className="admin-top-bar" style={{
        position: 'absolute', top: 0, left: 0, width: '100%',
        padding: '5px 20px', background: 'rgba(50, 0, 100, 0.8)',
        zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px',
        borderBottom: '1px solid #555', fontSize: '0.9rem', fontWeight: 'bold'
      }}>
        <span>👑 HOST: {adminName || "ROOT"}</span>
        <span style={{ color: '#2ecc71' }}>💰 BANK: ₹ {adminBalance?.toLocaleString()}</span>
        <button
          onClick={() => {
            logoutAdmin();
            navigate("/admin");
          }}
          style={{
            background: '#e74c3c', color: 'white', border: 'none', padding: '5px 15px',
            borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
          }}
        >
          LOGOUT
        </button>
      </div>

      {/* LEFT SIDE */}
      <SidePanel />

      {/* RIGHT SIDE */}
      <QuestionBoard />

      {/* OVERLAYS */}
      <QuestionOverlay />
      <BidPanel />
      <FeedbackOverlay />

      {/* FLOATING LEADERBOARD BUTTON */}
      <button
        className="leaderboard-fab"
        onClick={() => navigate("/leaderboard")}
        aria-label="Leaderboard"
      >
        🏆
      </button>
    </div>
  );
}
