import "../styles/game.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useSocket } from "../context/SocketContext";

import SidePanel from "../components/game/SidePanel";
import QuestionBoard from "../components/game/QuestionBoard";
import QuestionOverlay from "../components/game/QuestionOverlay";
import BidPanel from "../components/game/BidPanel";
import FeedbackOverlay from "../components/game/FeedbackOverlay";
import TimerModal from "../components/game/TimerModal";

export default function Game() {
  const navigate = useNavigate();
  const {
    isGameActive, adminBalance, adminName, setTeams, setAdminBalance, activeTeam,
    hasActiveAdmin, isAdminLoading, logoutAdmin, setQuestionResults, adminRoomId,
    refreshAdminBalance
  } = useGame();

  const [showTimer, setShowTimer] = useState(false);
  const socket = useSocket();

  // [NEW] Route Protection
  useEffect(() => {
    if (!isAdminLoading && !hasActiveAdmin) {
      navigate("/admin");
    }
  }, [isAdminLoading, hasActiveAdmin, navigate]);

  // Socket Listeners for Real-time Updates
  // Socket Listeners are now handled globally in SocketContext.jsx
  // to support updates on all pages (SugarCandy, etc.)

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
        <span style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💰 BANK: {adminBalance === null ? '...' : `₹ ${adminBalance.toLocaleString()}`}
          <button
            onClick={refreshAdminBalance}
            title="Refresh Balance"
            style={{
              background: 'transparent', border: '1px solid #2ecc71', color: '#2ecc71',
              borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ↻
          </button>
        </span>

        <button
          onClick={() => setShowTimer(true)}
          style={{
            background: 'transparent',
            border: '1px solid #f1c40f',
            color: '#f1c40f',
            padding: '5px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ⏱ TIMER
        </button>

        <button
          onClick={() => navigate("/admin")}
          style={{
            background: '#8e44ad',
            color: 'white',
            border: 'none',
            padding: '5px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          ⚙️ ADMIN PANEL
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              logoutAdmin();
              navigate("/admin");
            }
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
      <TimerModal isOpen={showTimer} onClose={() => setShowTimer(false)} />

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
