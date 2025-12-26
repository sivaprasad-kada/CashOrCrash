import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const GameContext = createContext();

const TOTAL_QUESTIONS = 100;
const GAME_API = "http://localhost:5000/api/game";
const TEAM_API = "http://localhost:5000/api/teams";

export const useGame = () => useContext(GameContext);



export function GameProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);

  // [UPDATED] Dynamic Questions State
  const [questions, setQuestions] = useState([]);

  const [bidState, setBidState] = useState({
    questionId: null,
    amount: null,
    confirmed: false,
  });

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionResults, setQuestionResults] = useState({});

  const [flipAll, setFlipAll] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [revealQuestion, setRevealQuestion] = useState(false);

  const [usedFiftyFifty, setUsedFiftyFifty] = useState({});
  const [usedHint, setUsedHint] = useState({});

  // [NEW] Animation coordination
  // phases: 'idle' | 'rotate' | 'emerge' | 'break'
  const [animationPhase, setAnimationPhase] = useState('idle');

  // [NEW] Game Status & Admin
  const [isGameActive, setIsGameActive] = useState(false);
  const [adminBalance, setAdminBalance] = useState(0);
  const [adminName, setAdminName] = useState("");

  // [NEW] Persist API
  const STATE_API = "http://localhost:5000/api/state";
  const ADMIN_API = "http://localhost:5000/api/admin";

  // [NEW] Admin Auth State
  const [hasActiveAdmin, setHasActiveAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [adminRoomId, setAdminRoomId] = useState(localStorage.getItem("adminRoomId") || null);

  // Check Admin Status on Mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await axios.get(`${ADMIN_API}/status`);
        setHasActiveAdmin(res.data.hasActiveAdmin);
      } catch (error) {
        console.error("Failed to check admin status", error);
      } finally {
        setIsAdminLoading(false);
      }
    };
    checkAdminStatus();

    // Optional: Poll every 30s to keep sync if multiple tabs
    const interval = setInterval(checkAdminStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loginAdmin = async (credentials) => {
    const res = await axios.post(`${ADMIN_API}/login`, credentials);
    if (res.data.success) {
      setHasActiveAdmin(true);
      if (res.data.user.roomId) {
        setAdminRoomId(res.data.user.roomId);
        localStorage.setItem("adminRoomId", res.data.user.roomId);
      }
      if (res.data.user.username) {
        localStorage.setItem("adminUsername", res.data.user.username);
        setAdminName(res.data.user.username);
      }
      return res.data;
    }
    throw new Error("Login failed");
  };

  const logoutAdmin = async (username) => {
    try {
      const userToLogout = username || localStorage.getItem("adminUsername");
      await axios.post(`${ADMIN_API}/logout`, { username: userToLogout });
      setHasActiveAdmin(false);
      setAdminRoomId(null);
      localStorage.removeItem("adminRoomId");
      localStorage.removeItem("adminUsername");
    } catch (err) { console.error("Logout error", err); }
  };

  // 1. Initial Load of State
  const activeTeam = teams.find((t) => t._id === activeTeamId);

  const refreshState = async () => {
    try {
      // [UPDATED] Room Filter
      // If admin, we know the room. If player, we might rely on global state or active session.
      const initialRoomQuery = adminRoomId ? `?roomId=${adminRoomId}` : "";

      // 1. Fetch Teams & State Logic
      const [teamsRes, stateRes] = await Promise.all([
        axios.get(`${TEAM_API}${initialRoomQuery}`),
        axios.get(`${STATE_API}${initialRoomQuery}`)
      ]);

      setTeams(teamsRes.data);
      const serverState = stateRes.data;

      setIsGameActive(serverState.isGameActive || false);

      // 2. Fetch Questions (Dependent on Room ID from State or Admin)
      // We must ensure we fetch questions locked for the SPECIFIC roomId of this game session
      const effectiveRoomId = adminRoomId || serverState.roomId;
      const questionRoomQuery = effectiveRoomId ? `?roomId=${effectiveRoomId}` : "";

      const questionsRes = await axios.get(`${GAME_API}/questions${questionRoomQuery}`);
      const serverQuestions = questionsRes.data;


      // Fetch Admin Balance
      // Prioritize the currently logged-in admin if available
      try {
        const adminsRes = await axios.get(ADMIN_API);
        const loggedInUsername = localStorage.getItem("adminUsername");

        let targetAdmin = null;

        if (loggedInUsername) {
          targetAdmin = adminsRes.data.find(a => a.username === loggedInUsername);
        }

        // Fallback to whoever started the game if current user not found or not logged in
        if (!targetAdmin && serverState.startedByAdminId) {
          targetAdmin = adminsRes.data.find(a => a._id === serverState.startedByAdminId);
        }

        if (targetAdmin) {
          setAdminBalance(targetAdmin.balance);
          setAdminName(targetAdmin.username);
        }
      } catch (e) { console.warn("Could not fetch admin details"); }

      const resultsMap = {};
      const questionList = serverQuestions.map(q => {
        if (q.locked && q.result) {
          resultsMap[q.number] = q.result;
        } else if (q.locked) {
          resultsMap[q.number] = "locked";
        }
        return { id: q.number };
      });

      setQuestions(questionList);
      setQuestionResults(resultsMap);

      if (serverState) {
        if (serverState.activeTeamId) setActiveTeamId(serverState.activeTeamId);
        else if (teamsRes.data.length > 0) setActiveTeamId(teamsRes.data[0]._id);

        if (serverState.currentQuestionId) {
          // KEY FIX: If result exists in our room-aware map, clear the "current" status
          if (resultsMap[serverState.currentQuestionId]) {
            console.log(`[SYNC] Question ${serverState.currentQuestionId} is already done/locked. Clearing state.`);
            clearCurrentQuestion();
          } else {
            // Only load if strictly NOT locked/answered
            await loadQuestion(serverState.currentQuestionId, false);
            setRevealQuestion(true);
            setShowOnlySelected(true);
          }
        }
      }

    } catch (err) {
      console.error("Failed to load game state:", err);
    }
  };

  useEffect(() => {
    refreshState();
  }, [adminRoomId]);

  // SOCKET LISTENERS
  useEffect(() => {
    // ... (existing comments)
  }, []);

  const refreshAdminBalance = async () => {
    // Helper to re-fetch
    // ...
  };

  // 2. Wrap SetActiveTeam with Persistence
  const updateActiveTeam = (id) => {
    setActiveTeamId(id);
    axios.put(STATE_API, { activeTeamId: id }).catch(console.error);
  };

  const loadQuestion = async (questionId, persist = true) => {
    const currentRoomId = adminRoomId || activeTeam?.roomId;
    const roomQuery = currentRoomId ? `?roomId=${currentRoomId}` : "";

    const res = await axios.get(`${GAME_API}/question/${questionId}${roomQuery}`);
    setSelectedQuestion(res.data);

    if (persist) {
      axios.put(STATE_API, { currentQuestionId: questionId, roomId: currentRoomId }).catch(console.error);
    }
  };

  const clearCurrentQuestion = () => {
    setSelectedQuestion(null);
    setBidState({ questionId: null, amount: null, confirmed: false });
    const currentRoomId = adminRoomId || activeTeam?.roomId;
    axios.put(STATE_API, { currentQuestionId: null, roomId: currentRoomId }).catch(console.error);
  };

  const useLifeline = async (payload) => {
    try {
      const res = await axios.post(`${GAME_API}/lifeline`, payload);
      // Update state if server returns updated question
      if (res.data.question) {
        setSelectedQuestion(prev => ({ ...prev, ...res.data.question }));
      }
      // [NEW] Sync Team state (lifelines, etc)
      if (res.data.team) {
        setTeams(prev => prev.map(t => String(t._id) === String(res.data.team._id) ? res.data.team : t));
      }
      return res.data;
    } catch (err) {
      console.error("Lifeline API failed:", err);
      throw err;
    }
  };

  const consumeLifeline = (lifelineId) => {
    // Optimistic update on Active Team Lifelines
    if (!activeTeamId) return;

    setTeams(prevTeams => prevTeams.map(team => {
      if (String(team._id) === String(activeTeamId)) {
        return {
          ...team,
          lifelines: team.lifelines.map(l => {
            if (l.hasOwnProperty(lifelineId)) {
              return { [lifelineId]: true };
            }
            return l;
          })
        };
      }
      return team;
    }));
  };

  return (
    <GameContext.Provider
      value={{
        teams,
        setTeams,
        activeTeam,
        activeTeamId,
        setActiveTeamId: updateActiveTeam,
        questions,
        bidState,
        setBidState,
        selectedQuestion,
        loadQuestion,
        clearCurrentQuestion,
        questionResults,
        setQuestionResults,
        flipAll,
        setFlipAll,
        showOnlySelected,
        setShowOnlySelected,
        revealQuestion,
        setRevealQuestion,
        consumeLifeline,
        useLifeline,
        saveLifelines: async (teamId, lifelines) => {
          const res = await axios.put(`${TEAM_API}/${teamId}`, { lifelines });
          setTeams(prev => prev.map(t => t._id === teamId ? res.data : t));
        },
        animationPhase,
        setAnimationPhase,
        isGameActive,
        adminBalance,
        adminName,
        setAdminBalance,
        hasActiveAdmin,
        isAdminLoading,
        loginAdmin,
        logoutAdmin,
        adminRoomId,
        refreshState // NEW EXPORT
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
