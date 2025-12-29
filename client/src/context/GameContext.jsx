import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const GameContext = createContext();

const TOTAL_QUESTIONS = 100;
const GAME_API = "/game";
const TEAM_API = "/teams";

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
  // [NEW] Game Status & Admin
  const [isGameActive, setIsGameActive] = useState(false);
  const [adminBalance, setAdminBalance] = useState(null); // Init as null for loading state
  const [adminName, setAdminName] = useState("");
  const [user, setUser] = useState(null); // [NEW] Full User Object (id, role, etc)

  // [NEW] Persist API
  const STATE_API = "/state";
  const ADMIN_API = "/admin";

  // [NEW] Axios Config handled in services/api.js

  // [UPDATED] Auth State
  const [hasActiveAdmin, setHasActiveAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [adminRoomId, setAdminRoomId] = useState(null); // No local storage fallback, strictly from session

  // [NEW] Scoped 50-50 State for Current Question
  // Reset this whenever question changes
  const [localFiftyFifty, setLocalFiftyFifty] = useState(false);

  // Check Admin Session on Mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get(`${ADMIN_API}/me`);
        if (res.data.success && res.data.admin) {
          setHasActiveAdmin(true);
          setUser(res.data.admin); // [NEW] Set User
          // Support both Root (activeRoomId) and Admin (roomId)
          // Also handle if roomId is an object (populated) or string
          const rawRoom = res.data.admin.activeRoomId || res.data.admin.roomId;
          const roomIdString = rawRoom?._id || rawRoom;

          setAdminRoomId(roomIdString);
          setAdminName(res.data.admin.username);
          setAdminBalance(res.data.admin.balance); // Initial balance logic
        } else {
          setHasActiveAdmin(false);
          setUser(null);
          setAdminRoomId(null);
          setAdminName("");
        }
      } catch (error) {
        console.error("Session check failed", error);
        setHasActiveAdmin(false);
        setUser(null);
      } finally {
        setIsAdminLoading(false);
      }
    };
    checkSession();
  }, []);

  const loginAdmin = async (credentials) => {
    const res = await api.post(`${ADMIN_API}/login`, credentials);
    if (res.data.success) {
      setHasActiveAdmin(true);
      setUser(res.data.user); // [NEW] Set User
      // Prioritize the explicitly returned roomId from token payload
      setAdminRoomId(res.data.roomId || res.data.user.roomId);
      setAdminName(res.data.user.username);
      return res.data;
    }
    throw new Error("Login failed");
  };

  const logoutAdmin = async () => {
    try {
      await api.post(`${ADMIN_API}/logout`);
      setHasActiveAdmin(false);
      setUser(null);
      setAdminRoomId(null);
      setAdminName("");
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
        api.get(`${TEAM_API}${initialRoomQuery}`),
        api.get(`${STATE_API}${initialRoomQuery}`)
      ]);

      setTeams(teamsRes.data);
      const serverState = stateRes.data;

      setIsGameActive(serverState.isGameActive || false);

      // 2. Fetch Questions (Dependent on Room ID from State or Admin)
      // We must ensure we fetch questions locked for the SPECIFIC roomId of this game session
      const effectiveRoomId = adminRoomId || serverState.roomId;
      const questionRoomQuery = effectiveRoomId ? `?roomId=${effectiveRoomId}` : "";

      const questionsRes = await api.get(`${GAME_API}/questions${questionRoomQuery}`);
      const serverQuestions = questionsRes.data;


      // Fetch Admin Balance
      // Fetch Admin Balance
      // STRICTLY use the authenticated session.
      try {
        const meRes = await api.get(`${ADMIN_API}/me`);
        if (meRes.data.success && meRes.data.admin) {
          setAdminBalance(meRes.data.admin.balance);
          setAdminName(meRes.data.admin.username);
          // Also ensure room ID matches if we are in admin mode?
          // setAdminRoomId(...) - usually consistent.
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

  // COOLDOWN STATE
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const REFRESH_COOLDOWN = 2000; // 2 seconds

  const refreshAdminBalance = async () => {
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_COOLDOWN) return; // Silent return
    setLastRefreshTime(now);

    try {
      if (adminRoomId) {
        const res = await api.get(`${ADMIN_API}/room-balance/${adminRoomId}`);
        if (res.data.success) setAdminBalance(res.data.balance);
      } else {
        const meRes = await api.get(`${ADMIN_API}/me`);
        if (meRes.data.success && meRes.data.admin) setAdminBalance(meRes.data.admin.balance);
      }
    } catch (e) {
      console.warn("Failed to refresh admin balance");
    }
  };

  const refreshTeamBalance = async (teamId) => {
    // Allows frequent updates for different teams, but debounced per global calls if needed
    // For specific team refresh, we let it pass but maybe debounce broadly?
    // Let's keep it simple: Just avoid rapid clicking.

    try {
      if (!teamId) return;
      const res = await api.get(`${TEAM_API}/${teamId}?t=${Date.now()}`);
      if (res.data) {
        setTeams(prev => prev.map(t => t._id === teamId ? res.data : t));
      }
    } catch (err) {
      console.error("Failed to refresh team balance", err);
    }
  };

  // 2. Wrap SetActiveTeam with Persistence
  const updateActiveTeam = (id) => {
    setActiveTeamId(id);
    api.put(STATE_API, { activeTeamId: id }).catch(console.error);
  };

  const loadQuestion = async (questionId, persist = true) => {
    setLocalFiftyFifty(false); // [NEW] Reset 50-50
    const currentRoomId = adminRoomId || activeTeam?.roomId;
    const roomQuery = currentRoomId ? `?roomId=${currentRoomId}` : "";

    const res = await api.get(`${GAME_API}/question/${questionId}${roomQuery}`);
    setSelectedQuestion(res.data);

    if (persist) {
      api.put(STATE_API, { currentQuestionId: questionId, roomId: currentRoomId }).catch(console.error);
    }
  };

  const clearCurrentQuestion = () => {
    setLocalFiftyFifty(false); // [NEW] Reset 50-50
    setSelectedQuestion(null);
    setBidState({ questionId: null, amount: null, confirmed: false });
    const currentRoomId = adminRoomId || activeTeam?.roomId;
    api.put(STATE_API, { currentQuestionId: null, roomId: currentRoomId }).catch(console.error);
  };

  const useLifeline = async (payload) => {
    try {
      const res = await api.post(`${GAME_API}/lifeline`, payload);
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
          const res = await api.put(`${TEAM_API}/${teamId}`, { lifelines });
          setTeams(prev => prev.map(t => t._id === teamId ? res.data : t));
        },
        animationPhase,
        setAnimationPhase,
        isGameActive,
        adminBalance,
        adminName,
        setAdminBalance,
        user, // [NEW]
        hasActiveAdmin,
        isAdminLoading,
        loginAdmin,
        logoutAdmin,
        adminRoomId,
        refreshState,
        refreshAdminBalance, // Export
        refreshTeamBalance, // [NEW]
        localFiftyFifty,
        setLocalFiftyFifty
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
