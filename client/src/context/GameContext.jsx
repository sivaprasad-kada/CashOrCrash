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
      // If server returns user, we can store it or just rely on status
      return res.data;
    }
    throw new Error("Login failed");
  };

  const logoutAdmin = async (username) => {
    try {
      await axios.post(`${ADMIN_API}/logout`, { username });
      setHasActiveAdmin(false);
    } catch (err) { console.error("Logout error", err); }
  };

  // 1. Initial Load of State
  const activeTeam = teams.find((t) => t._id === activeTeamId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, stateRes, questionsRes] = await Promise.all([
          axios.get(TEAM_API),
          axios.get(STATE_API),
          axios.get(`${GAME_API}/questions`)
        ]);

        setTeams(teamsRes.data);
        const serverState = stateRes.data;

        setIsGameActive(serverState.isGameActive || false);

        // Fetch Admin Balance if game started
        if (serverState.startedByAdminId) {
          // We can't easily fetch single admin by ID publically without auth usually, 
          // but assuming we add a route or allow it for game display.
          // Let's rely on stored value or fetch all admins and find? (Inefficient but works for small count)
          // Better: Updated gamestate endpoint to populate it, or specialized route.
          // For now, let's fetch all admins (since we have the route) and find the one.
          try {
            const adminsRes = await axios.get(ADMIN_API);
            const admin = adminsRes.data.find(a => a._id === serverState.startedByAdminId);
            if (admin) {
              setAdminBalance(admin.balance);
              setAdminName(admin.username);
            }
          } catch (e) { console.warn("Could not fetch admin details"); }
        }

        const serverQuestions = questionsRes.data;
        // ... rest of sync logic ...

        // ... existing sync logic ...
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
            if (resultsMap[serverState.currentQuestionId]) clearCurrentQuestion();
            else {
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
    fetchData();
  }, []);

  // SOCKET LISTENERS
  useEffect(() => {
    // Need socket instance - implicitly usage via hooks or global? 
    // SocketContext provides useSocket(). 
    // We are in GameProvider, so we can't use useSocket if SocketProvider wraps GameProvider?
    // App.jsx: GameProvider wraps SocketProvider. So NO useSocket here.
    // But we can import `io` or separate listener hook. 
    // Actually, standard is to use `SocketContext` inside components.
    // But we want to update global state.
    // Let's move socket listeners to a wrapper or exposing `updateTeams` ...
    // For now, let components handle it? No, context state needs update.
    // App.jsx Structure: <GameProvider><SocketProvider>...
    // This means GameContext CANNOT access SocketContext.
    // Fix: Swap provider order in App.jsx in next step.
    // For now, I will add `updateAdminBalance` and `updateTeams` functions to Context 
    // so a child component (like a "GameManager" or Game.jsx) can listen and call them.
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
    const res = await axios.get(`${GAME_API}/question/${questionId}`);
    setSelectedQuestion(res.data);

    if (persist) {
      axios.put(STATE_API, { currentQuestionId: questionId }).catch(console.error);
    }
  };

  const clearCurrentQuestion = () => {
    setSelectedQuestion(null);
    setBidState({ questionId: null, amount: null, confirmed: false });
    axios.put(STATE_API, { currentQuestionId: null }).catch(console.error);
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

  // Move this safely below defining functions but before return
  // (Actually moved up to line 46 earlier, let's just make sure it's singular)
  // I will remove the one at 170.

  return (
    <GameContext.Provider
      value={{
        teams,
        setTeams,
        activeTeam,
        activeTeamId,
        setActiveTeamId: updateActiveTeam, // Use wrapper
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
        adminName,
        setAdminBalance, // Exposed for socket updates
        setTeams, // Exposed
        hasActiveAdmin,
        isAdminLoading,
        loginAdmin,
        logoutAdmin
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
