import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useGame } from "../context/GameContext";
import gsap from "gsap";
import "../styles/admin.css";

const API_URL = "/teams";
const ADMIN_API = "/admin";
const ROOM_API = "/rooms";

export default function Admin() {
    const navigate = useNavigate();
    const { user, logoutAdmin, refreshState, isAdminLoading } = useGame();

    // Data State
    const [teams, setTeams] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [admins, setAdmins] = useState([]);

    // Forms
    const [newTeam, setNewTeam] = useState({ name: "", balance: 10000 });
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "", role: "admin", roomId: "" });
    const [newRoomName, setNewRoomName] = useState("");

    // Lifeline Modal State
    const [selectedTeamForLifeline, setSelectedTeamForLifeline] = useState(null);
    const [lifelineModalOpen, setLifelineModalOpen] = useState(false);

    // Root Room Control
    const [activeRoomId, setActiveRoomId] = useState(""); // For Dropdown

    const containerRef = useRef(null);
    const [processingAction, setProcessingAction] = useState(false);

    // --- EDIT TEAM MODAL ---
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);

    const openEditModal = (team) => {
        setEditingTeam({ ...team }); // Clone to avoid direct mutation
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditingTeam(null);
    };

    const handleUpdateTeam = async (e) => {
        e.preventDefault();
        try {
            const { _id, name, balance, unityTokens, sugarCandy } = editingTeam;
            const res = await api.put(`${API_URL}/${_id}`, {
                name,
                balance: Number(balance),
                unityTokens: Number(unityTokens),
                sugarCandy: Number(sugarCandy)
            });

            // Optimistic Update
            const updated = res.data;
            setTeams(prev => prev.map(t => t._id === updated._id ? updated : t));

            closeEditModal();
            alert("Team Updated!");
        } catch (err) {
            alert("Failed to update team");
        }
    };

    // --- CHECK SESSION & REDIRECT ---
    useEffect(() => {
        if (!isAdminLoading) {
            if (!user) {
                navigate("/admin/login");
            }
        }
    }, [user, isAdminLoading, navigate]);

    // --- FETCH ROOMS ON MOUNT ---
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get(ROOM_API);
                setRooms(res.data);
            } catch (err) { console.error("Failed to fetch rooms"); }
        };
        fetchRooms();
    }, []);

    // --- INITIAL DATA FETCH ---
    const fetchData = async () => {
        if (!user) return;
        try {
            // 2. Fetch Teams (Scoped to current room)
            // If Root, use activeRoomId from user session if available
            // Note: user object is updated from getMe (populated roomId)
            const currentRoomId = user?.activeRoomId || (user?.roomId?._id ?? user?.roomId);

            if (currentRoomId) {
                const teamsRes = await api.get(`${API_URL}?roomId=${currentRoomId}`);
                setTeams(teamsRes.data);
            } else {
                setTeams([]); // No room selected/assigned
            }

            // 3. Fetch Admins (Root Only)
            if (user?.role === "root") {
                const adminsRes = await api.get(ADMIN_API);
                setAdmins(adminsRes.data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    // Check Session on Mount (Removed - handled by GameContext)

    useEffect(() => {
        if (user) {
            fetchData();
            gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 });
        }
    }, [user?.roomId, user?.activeRoomId, user?.role, user]); // Re-fetch if room changes


    // --- ROOT: ENTER ROOM ---
    const enterRoom = async () => {
        if (!activeRoomId) return alert("Select a room");
        try {
            await api.post(`${ADMIN_API}/enter-room`, { roomId: activeRoomId });
            // Refresh User State to get new activeRoomId
            // GameContext should handle this if we trigger a refresh or manual update
            // Ideally call checkSession or similar.
            // For now, reload window or rely on response.
            // Actually, we can just call window.location.reload() to refresh everything cleanly
            window.location.reload();
        } catch (err) {
            alert("Failed to switch room");
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) return;
        await logoutAdmin();
        setTeams([]);
        navigate("/admin/login");
    };

    if (isAdminLoading || !user) return <div style={{ color: 'white', padding: 50 }}>Loading Admin Portal...</div>;

    // --- ASSIGN TEAM ROOM (ROOT) ---
    const assignRoom = async (teamId, newRoomId) => {
        if (!newRoomId) return;
        try {
            await api.post(`${ADMIN_API}/assign-team-room`, { teamId, roomId: newRoomId });
            fetchData(); // specific team will likely vanish from list if filtered by room
        } catch (err) {
            alert("Failed to assign room");
        }
    };

    // --- RENDER DASHBOARD (ROOT ONLY ESSENTIALLY) ---
    const addTeam = async (e) => {
        e.preventDefault();
        const currentRoomId = user?.activeRoomId || (user?.roomId?._id ?? user?.roomId);
        if (!newTeam.name || !currentRoomId) return alert("No active room to add team to.");

        try {
            await api.post(API_URL, { ...newTeam, roomId: currentRoomId });
            setNewTeam({ name: "", balance: 10000 });
            fetchData();
        } catch (err) {
            alert("Failed to create team.");
        }
    };

    const deleteTeam = async (id) => {
        if (!window.confirm("Delete team?")) return;
        try { await api.delete(`${API_URL}/${id}`); fetchData(); } catch (err) { }
    };

    const updateBalance = async (id, current, amount) => {
        // Optimistic UI Update immediately
        const newBalance = current + amount;
        setTeams(prev => prev.map(t => t._id === id ? { ...t, balance: newBalance } : t));

        try {
            const res = await api.put(`${API_URL}/${id}`, { balance: newBalance });
            // Confirm with server response if needed, but optimistic is fastest
            if (res.data) setTeams(prev => prev.map(t => t._id === id ? res.data : t));
        } catch (err) {
            // Revert on failure
            setTeams(prev => prev.map(t => t._id === id ? { ...t, balance: current } : t));
            alert("Update failed, reverted balance.");
        }
    };

    const addResource = async (teamId, type, amount) => {
        if (processingAction) return;
        setProcessingAction(true);
        setTimeout(() => setProcessingAction(false), 500); // 500ms debounce

        try {
            const res = await api.post(`${ADMIN_API}/update-team-resources`, {
                teamId, type, amount, adminId: user._id
            });

            // Optimistic / Local Update
            const updatedTeam = res.data;
            setTeams(prevTeams => prevTeams.map(t => t._id === updatedTeam._id ? updatedTeam : t));

            // No Alert needed if UI updates instantly, or small toast. 
            // Existing alert is fine but let's make it console log or subtle if we want "real-time" feel.
            // Keeping alert but minimal blocking? 
            // Actually user asked for "Simulates real-time...". Alerts block execution.
            // Let's remove alert or use a temporary status. For now, just console log.
            console.log(`Added ${type}`);
        } catch (err) {
            alert(err.response?.data?.error || "Failed");
        }
    };

    const updateLifeline = async (teamId, lifeline, action) => {
        try {
            const res = await api.post(`${ADMIN_API}/update-team-lifeline`, { teamId, lifelineName: lifeline, action });
            const updatedTeam = res.data;

            // Update teams list immutably
            setTeams(prevTeams => prevTeams.map(t => t._id === teamId ? updatedTeam : t));

            // Update modal selected team if it matches
            if (selectedTeamForLifeline && selectedTeamForLifeline._id === teamId) {
                setSelectedTeamForLifeline(updatedTeam);
            }
        } catch (err) {
            console.error("Update lifeline error", err);
            alert("Failed to update lifeline");
        }
    };

    const openLifelineModal = (team) => {
        setSelectedTeamForLifeline(team);
        setLifelineModalOpen(true);
    };

    const closeLifelineModal = () => {
        setLifelineModalOpen(false);
        setSelectedTeamForLifeline(null);
    };

    // --- ROOT MANAGEMENT ---
    const createRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post(ROOM_API, { name: newRoomName });
            setNewRoomName("");
            fetchData(); // Refresh room lists
            alert("Room Created");
        } catch (err) { alert("Failed"); }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm("Are you sure you want to delete this admin?")) return;
        try {
            await api.delete(`${ADMIN_API}/${id}`);
            fetchData();
            alert("Admin Deleted");
        } catch (err) {
            alert(err.response?.data?.error || "Failed");
        }
    };

    const createAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post(`${ADMIN_API}/add`, newAdmin);
            setNewAdmin({ username: "", password: "", role: "admin", roomId: "" });
            fetchData();
            alert("Admin Created");
        } catch (err) {
            alert(err.response?.data?.error || "Failed");
        }
    };

    const handleStartGame = async () => {
        if (!window.confirm("Start Game for THIS room?")) return;
        const currentRoomId = user?.activeRoomId || (user?.roomId?._id ?? user?.roomId);
        if (!currentRoomId) return alert("No active room selected.");

        try {
            await api.put("/state", { isGameActive: true, startedByAdminId: user._id, roomId: currentRoomId });
            if (refreshState) await refreshState();
            alert("Game Started!");
            navigate("/game");
        } catch (err) {
            alert("Failed to start game.");
        }
    };

    // --- RENDER LOGIN ---
    if (!user) {
        return (
            <div className="admin-login-container">
                <form onSubmit={handleLogin} className="login-box glass-panel">
                    <h2>ADMIN PORTAL</h2>
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit">LOGIN</button>
                    {/* NO ROOM SELECTION HERE */}
                </form>
            </div>
        );
    }

    const activeId = user?.activeRoomId || (user?.roomId?._id ?? user?.roomId);
    const currentRoomName = rooms.find(r => r._id === activeId)?.name || "NO ACTIVE ROOM";

    return (
        <div className="admin-dashboard" ref={containerRef}>
            <header className="admin-header">
                <div className="header-left">
                    <h1>COMMAND CENTER</h1>
                    <span className="user-badge">
                        {user.username.toUpperCase()} ({user.role.toUpperCase()})
                        <span style={{ marginLeft: '10px', color: '#ffd700' }}>
                            @ {currentRoomName}
                        </span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleStartGame} className="btn-purple" style={{ padding: '10px 20px' }}>ENTER ARENA</button>
                    <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
                </div>
            </header>

            <div className="admin-content">

                {/* LEFT COL: TEAMS (Only if Room Seleted) */}
                <div className="left-col">
                    {(user?.activeRoomId || (user?.roomId?._id ?? user?.roomId)) ? (
                        <>
                            <div className="panel add-team-panel">
                                <h3>ADD SQUAD TO: {currentRoomName}</h3>
                                <form onSubmit={addTeam}>
                                    <input type="text" placeholder="Team Name" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
                                    <input type="number" placeholder="Balance" value={newTeam.balance} onChange={(e) => setNewTeam({ ...newTeam, balance: Number(e.target.value) })} />
                                    <button type="submit">DEPLOY</button>
                                </form>
                            </div>

                            <div className="panel team-list-panel">
                                <h3>TEAMS IN ROOM ({teams.length})</h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>NAME</th>

                                                <th>BALANCE</th>
                                                <th>TOKENS</th>
                                                <th>CANDY</th>
                                                <th>LIFELINES</th>
                                                {user.role === 'root' && <th>ROOM ASSIGNMENT</th>}
                                                <th>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teams.map((team) => (
                                                <tr key={team._id}>
                                                    <td>{team.name}</td>
                                                    <td>₹ {team.balance?.toLocaleString()}</td>
                                                    <td>{team.unityTokens || 0}</td>
                                                    <td>{team.sugarCandy || 0}</td>
                                                    <td>
                                                        <button
                                                            onClick={() => openLifelineModal(team)}
                                                            className="btn-purple"
                                                            style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                                        >
                                                            MANAGE
                                                        </button>
                                                    </td>
                                                    {user.role === 'root' && (
                                                        <td>
                                                            <select
                                                                value={team.roomId?._id || team.roomId}
                                                                onChange={(e) => assignRoom(team._id, e.target.value)}
                                                                style={{ padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
                                                            >
                                                                {rooms.map(r => (
                                                                    <option key={r._id} value={r._id}>{r.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    )}
                                                    <td className="actions">
                                                        <button className="btn-small btn-purple" style={{ background: '#3498db' }} onClick={() => openEditModal(team)}>✏️</button>
                                                        <button className="btn-small btn-green" onClick={() => updateBalance(team._id, team.balance, 1000)}>+1k</button>
                                                        <button className="btn-small btn-purple" onClick={() => {
                                                            if (window.confirm(`Give 1 Unity Token to ${team.name}?`)) {
                                                                addResource(team._id, 'unityTokens', 1);
                                                            }
                                                        }}>+Token</button>
                                                        <button className="btn-small btn-pink" style={{ background: '#e91e63' }} onClick={() => {
                                                            if (window.confirm(`Give 1 Sugar Candy to ${team.name}?`)) {
                                                                addResource(team._id, 'sugarCandy', 1);
                                                            }
                                                        }}>+Candy</button>
                                                        <button className="btn-small btn-delete" onClick={() => deleteTeam(team._id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="panel" style={{ textAlign: 'center', padding: '50px' }}>
                            <h3>SELECT A ROOM TO MANAGE</h3>
                        </div>
                    )}
                </div>

                {/* RIGHT COL: ROOT CONTROLS */}
                {user.role === "root" && (
                    <div className="right-col">

                        {/* 1. ROOM CONTROL */}
                        <div className="panel room-control-panel" style={{ border: '1px solid gold' }}>
                            <h3>⚠️ ROOT CONTROL: ACTIVE ROOM</h3>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select
                                    value={activeRoomId}
                                    onChange={(e) => setActiveRoomId(e.target.value)}
                                    style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: '1px solid #555' }}
                                >
                                    <option value="">-- Select Room --</option>
                                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                                <button onClick={enterRoom} className="btn-purple">SWITCH ROOM</button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                * Switching rooms enables you to manage teams and start games for that specific room.
                            </p>

                            <hr style={{ borderColor: '#444', margin: '20px 0' }} />

                            <h4>CREATE NEW ROOM</h4>
                            <form onSubmit={createRoom} style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" placeholder="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                                <button type="submit" className="btn-green">CREATE</button>
                            </form>
                        </div>

                        {/* 2. ADMIN CONTROL */}
                        <div className="panel admin-mgmt-panel">
                            <h3>MANAGE ADMINS</h3>
                            <form onSubmit={createAdmin} className="admin-form">
                                <input type="text" placeholder="Username" value={newAdmin.username} onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })} />
                                <input type="text" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                                <select value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })} style={{ background: '#333', color: 'white', border: '1px solid #555', padding: '10px' }}>
                                    <option value="admin">Regular Admin</option>
                                    <option value="root">Root Admin</option>
                                </select>

                                {/* ROOM SELECT FOR REGULAR ADMIN */}
                                {newAdmin.role === 'admin' && (
                                    <select
                                        value={newAdmin.roomId}
                                        onChange={e => setNewAdmin({ ...newAdmin, roomId: e.target.value })}
                                        required
                                        style={{ background: '#333', color: 'white', border: '1px solid #555', padding: '10px', marginTop: '10px' }}
                                    >
                                        <option value="">-- Assign Room (Required) --</option>
                                        {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                    </select>
                                )}

                                <button type="submit" className="btn-purple" style={{ marginTop: '10px' }}>CREATE ADMIN</button>
                            </form>

                            <div className="admin-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {admins.map(a => (
                                    <div key={a._id} className="admin-item" style={{ fontSize: '0.8rem', padding: '5px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <b>{a.username}</b> ({a.role})
                                            {a.roomId && <span style={{ color: 'var(--text-dim)', marginLeft: '5px' }}>{"->"} {a.roomId.name || "Room"}</span>}
                                        </div>
                                        {user._id !== a._id && (
                                            <button
                                                onClick={() => handleDeleteAdmin(a._id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--danger)',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem',
                                                    padding: '0 5px'
                                                }}
                                                title="Delete Admin"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* LIFELINE MANAGEMENT MODAL */}
            {
                lifelineModalOpen && selectedTeamForLifeline && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000, backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{
                            background: 'var(--glass-bg)', padding: '30px', borderRadius: '15px', width: '500px',
                            border: '1px solid var(--purple-main)', color: 'white', textAlign: 'center',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}>
                            <h2 style={{ color: 'var(--gold)', marginBottom: '20px' }}>MANAGE LIFELINES</h2>
                            <h3 style={{ marginBottom: '30px', color: 'var(--white)' }}>TEAM: {selectedTeamForLifeline.name}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* 50-50 */}
                                {(() => {
                                    const l50 = selectedTeamForLifeline.lifelines?.find(l => l.hasOwnProperty("50-50"));
                                    const isUsed50 = l50 ? l50["50-50"] : false;
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                            <span style={{ fontWeight: 'bold' }}>50-50</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ color: isUsed50 ? 'var(--danger)' : 'var(--neon-blue)', fontWeight: 'bold' }}>
                                                    {isUsed50 ? "USED (Disabled)" : "READY (Enabled)"}
                                                </span>
                                                <button
                                                    onClick={() => updateLifeline(selectedTeamForLifeline._id, "50-50", isUsed50 ? "reset" : "remove")}
                                                    style={{
                                                        padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                                                        background: isUsed50 ? 'var(--neon-blue)' : 'var(--danger)', color: isUsed50 ? 'black' : 'white', fontWeight: 'bold'
                                                    }}
                                                >
                                                    {isUsed50 ? "↺ RE-ENABLE" : "✕ DISABLE"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* QUESTION SWAP */}
                                {(() => {
                                    const lSwap = selectedTeamForLifeline.lifelines?.find(l => l.hasOwnProperty("QUESTION-SWAP"));
                                    const isUsedSwap = lSwap ? lSwap["QUESTION-SWAP"] : false;
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                            <span style={{ fontWeight: 'bold' }}>QUESTION SWAP</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ color: isUsedSwap ? 'var(--danger)' : 'var(--neon-blue)', fontWeight: 'bold' }}>
                                                    {isUsedSwap ? "USED (Disabled)" : "READY (Enabled)"}
                                                </span>
                                                <button
                                                    onClick={() => updateLifeline(selectedTeamForLifeline._id, "QUESTION-SWAP", isUsedSwap ? "reset" : "remove")}
                                                    style={{
                                                        padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                                                        background: isUsedSwap ? 'var(--neon-blue)' : 'var(--danger)', color: isUsedSwap ? 'black' : 'white', fontWeight: 'bold'
                                                    }}
                                                >
                                                    {isUsedSwap ? "↺ RE-ENABLE" : "✕ DISABLE"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* EXTRA TIME */}
                                {(() => {
                                    const lTime = selectedTeamForLifeline.lifelines?.find(l => l.hasOwnProperty("EXTRA-TIME"));
                                    const isUsedTime = lTime ? lTime["EXTRA-TIME"] : false;
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#333', padding: '10px 20px', borderRadius: '8px' }}>
                                            <span style={{ fontWeight: 'bold' }}>EXTRA TIME</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ color: isUsedTime ? '#ff4d4d' : '#2ecc71', fontWeight: 'bold' }}>
                                                    {isUsedTime ? "USED (Disabled)" : "READY (Enabled)"}
                                                </span>
                                                <button
                                                    onClick={() => updateLifeline(selectedTeamForLifeline._id, "EXTRA-TIME", isUsedTime ? "reset" : "remove")}
                                                    style={{
                                                        padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                                                        background: isUsedTime ? '#2ecc71' : '#ff4d4d', color: isUsedTime ? 'black' : 'white', fontWeight: 'bold'
                                                    }}
                                                >
                                                    {isUsedTime ? "↺ RE-ENABLE" : "✕ DISABLE"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <button
                                onClick={closeLifelineModal}
                                style={{
                                    marginTop: '30px', padding: '10px 30px', borderRadius: '5px',
                                    background: '#aaa', border: 'none', color: 'black', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                )}
            {/* TEAM EDIT MODAL */}
            {editModalOpen && editingTeam && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1001, backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: '#1a1a1a', padding: '30px', borderRadius: '15px', width: '400px',
                        border: '1px solid #3498db', color: 'white',
                        boxShadow: '0 0 30px rgba(52, 152, 219, 0.3)'
                    }}>
                        <h2 style={{ color: '#3498db', marginBottom: '20px', textAlign: 'center' }}>EDIT {editingTeam.name}</h2>

                        <form onSubmit={handleUpdateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Team Name</label>
                                <input
                                    type="text"
                                    value={editingTeam.name}
                                    onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Balance</label>
                                <input
                                    type="number"
                                    value={editingTeam.balance}
                                    onChange={e => setEditingTeam({ ...editingTeam, balance: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Unity Tokens</label>
                                    <input
                                        type="number"
                                        value={editingTeam.unityTokens || 0}
                                        onChange={e => setEditingTeam({ ...editingTeam, unityTokens: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Sugar Candy</label>
                                    <input
                                        type="number"
                                        value={editingTeam.sugarCandy || 0}
                                        onChange={e => setEditingTeam({ ...editingTeam, sugarCandy: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={closeEditModal} style={{ flex: 1, padding: '10px', background: '#555', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>CANCEL</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3498db', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px' }}>SAVE CHANGES</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

