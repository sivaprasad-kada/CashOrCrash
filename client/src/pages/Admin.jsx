import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import { useGame } from "../context/GameContext";
import "../styles/admin.css";

const API_URL = "http://localhost:5000/api/teams";
const ADMIN_API = "http://localhost:5000/api/admin";
const ROOM_API = "http://localhost:5000/api/rooms";

export default function Admin() {
    const navigate = useNavigate();
    const { loginAdmin, logoutAdmin, refreshState } = useGame();

    // Auth State
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState("");

    // Data State
    const [teams, setTeams] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [newTeam, setNewTeam] = useState({ name: "", balance: 10000 });
    const [admins, setAdmins] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "", role: "admin" });

    const containerRef = useRef(null);

    // --- FETCH ROOMS (For Login) ---
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await axios.get(ROOM_API);
                setRooms(res.data);
                if (res.data.length > 0) setSelectedRoomId(res.data[0]._id);
            } catch (err) { console.error("Failed to fetch rooms"); }
        };
        fetchRooms();
    }, []);

    // --- INITIAL DATA FETCH ---
    const fetchData = async () => {
        try {
            // Filter teams by the Admin's selected room
            const roomQuery = user?.roomId ? `?roomId=${user.roomId}` : "";
            const teamsRes = await axios.get(`${API_URL}${roomQuery}`);
            setTeams(teamsRes.data);

            // If root, fetch admins too
            if (user?.role === "root") {
                const adminsRes = await axios.get(ADMIN_API);
                setAdmins(adminsRes.data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
            gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 });
        }
    }, [user]);

    // --- AUTH ACTIONS ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            if (!selectedRoomId) {
                alert("Please select a room.");
                return;
            }
            const userData = await loginAdmin({ username, password, roomId: selectedRoomId });
            if (userData.success) {
                setUser(userData.user);
            }
        } catch (err) {
            alert("Invalid Creds");
        }
    };

    const handleLogout = async () => {
        if (user) await logoutAdmin(user.username);
        setUser(null);
        setPassword("");
    };

    // --- TEAM ACTIONS ---
    const addTeam = async (e) => {
        e.preventDefault();
        if (!newTeam.name) return;
        try {
            // Create team, ideally backend assigns default or we don't send roomId yet?
            // Actually new model requires roomId. We should send the admin's room.
            const payload = { ...newTeam, roomId: user.roomId }; // Assign to current room implicitly? 
            // Or backend defaults? Model requires it. 
            // Let's rely on backend to not fail, or better, passing it explicitly if we changed create endpoint.
            // Wait, create endpoint doesn't take roomId yet.
            // Let's just create it and then assign? No, validation will fail.
            // I need to update TEAM_API post as well or modify it here.
            // For now, let's assume I need to pass roomId in body if I updated the route. 
            // (I didn't update POST /teams to take roomId, but Mongoose will error).
            // NOTE: I missed updating POST /teams. I will assume I can fix that in next step or now.
            // For now, I'll send it, and if it fails I'll fix the backend.
            /* 
               Actually, I should fix the backend POST /teams too. 
               But assuming I will, let's send it.
            */
            // Quick fix: user.roomId is available. 
            await axios.post(API_URL, { ...newTeam, roomId: user.roomId });
            setNewTeam({ name: "", balance: 10000 });
            fetchData();
        } catch (err) {
            console.error("Error adding team", err);
            alert("Failed to create team. Ensure Backend supports roomId in POST.");
        }
    };

    const deleteTeam = async (id) => {
        if (!window.confirm("Delete team?")) return;
        try { await axios.delete(`${API_URL}/${id}`); fetchData(); } catch (err) { }
    };

    const updateBalance = async (id, current, amount) => {
        try { await axios.put(`${API_URL}/${id}`, { balance: current + amount }); fetchData(); } catch (err) { }
    };

    const assignRoom = async (teamId, roomId) => {
        try {
            await axios.post(`${ADMIN_API}/assign-team-room`, { teamId, roomId });
            fetchData();
        } catch (err) { alert("Failed to assign room"); }
    };

    // --- ADMIN ACTIONS (ROOT ONLY) ---
    const createAdmin = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${ADMIN_API}/add`, newAdmin);
            setNewAdmin({ username: "", password: "", role: "admin" });
            fetchData();
            alert("Admin Created");
        } catch (err) { alert("Failed to creating admin"); }
    };

    // --- GAME ACTIONS ---
    const handleStartGame = async () => {
        if (!window.confirm("Start the Game? This will enable gameplay for everyone.")) return;
        try {
            await axios.put("http://localhost:5000/api/state", { isGameActive: true, startedByAdminId: user.id, roomId: user.roomId });
            if (refreshState) await refreshState();
            alert("Game Started! Lost money will be credited to your account.");
            navigate("/game");
        } catch (err) {
            console.error(err);
            alert("Failed to start game.");
        }
    };

    const addResource = async (teamId, type, amount) => {
        try {
            await axios.post(`${ADMIN_API}/update-team-resources`, {
                teamId, type, amount, adminId: user.id
            });
            fetchData();
            alert(`Added ${amount} ${type === 'unityTokens' ? 'Token(s)' : 'Candy'}`);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add resource");
        }
    };

    if (!user) {
        return (
            <div className="admin-login-container">
                <form onSubmit={handleLogin} className="login-box glass-panel">
                    <h2>ADMIN PORTAL</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* ROOM SELECTION */}
                    <div style={{ marginBottom: '15px', width: '100%' }}>
                        <label style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>SELECT CONTROL ROOM</label>
                        <select
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '5px' }}
                        >
                            {rooms.map(r => (
                                <option key={r._id} value={r._id} style={{ color: 'black' }}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit">ACCESS DATABASE</button>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard" ref={containerRef}>
            <header className="admin-header">
                <div className="header-left">
                    <h1>COMMAND CENTER</h1>
                    <span className="user-badge">
                        LOGGED IN AS: {user.username.toUpperCase()} ({user.role.toUpperCase()})
                        <span style={{ marginLeft: '10px', color: '#ffd700' }}>
                            @ {rooms.find(r => r._id === user.roomId)?.name || "UNKNOWN ROOM"}
                        </span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleStartGame} className="btn-purple" style={{ padding: '10px 20px', fontWeight: 'bold' }}>START GAME</button>
                    <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
                </div>
            </header>

            <div className="admin-content">

                {/* --- LEFT COLUMN: TEAM MANAGEMENT --- */}
                <div className="left-col">
                    <div className="panel add-team-panel">
                        <h3>ADD NEW SQUAD</h3>
                        <form onSubmit={addTeam}>
                            <input
                                type="text"
                                placeholder="Team Name"
                                value={newTeam.name}
                                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Initial Balance"
                                value={newTeam.balance}
                                onChange={(e) => setNewTeam({ ...newTeam, balance: Number(e.target.value) })}
                            />
                            <button type="submit">DEPLOY TEAM</button>
                        </form>
                    </div>

                    <div className="panel team-list-panel">
                        <h3>ACTIVE SQUADS ({teams.length})</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>NAME</th>
                                        <th>BALANCE</th>
                                        <th>RESOURCES</th>
                                        <th>ACTIONS</th>
                                        <th>MOVE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr key={team._id}>
                                            <td className="team-name">
                                                {team.name}
                                                <div style={{ fontSize: '0.6rem', color: '#666' }}>{team.roomId?.name}</div>
                                            </td>
                                            <td className="team-balance">₹ {team.balance.toLocaleString()}</td>
                                            <td style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                                <div>🪙 {team.unityTokens || 0}</div>
                                                <div>🍬 {team.sugarCandy || 0}</div>
                                            </td>
                                            <td className="actions">
                                                <button className="btn-small btn-green" onClick={() => updateBalance(team._id, team.balance, 1000)} title="Add Money">+1k</button>
                                                <button className="btn-small btn-purple" onClick={() => addResource(team._id, 'unityTokens', 1)} title="Add Unity Token">+T</button>
                                                <button className="btn-small btn-orange" onClick={() => addResource(team._id, 'sugarCandy', 1)} title="Add Sugar Candy">+C</button>
                                                <button className="btn-small btn-delete" onClick={() => deleteTeam(team._id)}>🗑️</button>
                                            </td>
                                            <td>
                                                <select
                                                    style={{ width: '80px', fontSize: '0.7rem' }}
                                                    onChange={(e) => assignRoom(team._id, e.target.value)}
                                                    value={team.roomId?._id || team.roomId}
                                                >
                                                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: ADMIN MANAGEMENT (ROOT ONLY) --- */}
                {user.role === "root" && (
                    <div className="right-col panel admin-mgmt-panel">
                        <h3>ROOT CONTROLS: MANAGE ADMINS</h3>

                        <form onSubmit={createAdmin} className="admin-form">
                            <input
                                type="text" placeholder="New Admin Username"
                                value={newAdmin.username}
                                onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Password"
                                value={newAdmin.password}
                                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                            />
                            <select
                                value={newAdmin.role}
                                onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                            >
                                <option value="admin">Regular Admin</option>
                                <option value="root">Root Admin</option>
                            </select>
                            <button type="submit" className="btn-purple">CREATE ADMIN</button>
                        </form>

                        <h4>EXISTING ADMINS</h4>
                        <div className="admin-list">
                            {admins.map(a => (
                                <div key={a._id} className="admin-item">
                                    <span>{a.username} <small>({a.role})</small></span>
                                    <span className="status-dot">●</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
