import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // [NEW]
import axios from "axios";
import gsap from "gsap";
import { useGame } from "../context/GameContext"; // [NEW]
import "../styles/admin.css";

const API_URL = "http://localhost:5000/api/teams";
const ADMIN_API = "http://localhost:5000/api/admin";

export default function Admin() {
    const navigate = useNavigate(); // [NEW]
    const { loginAdmin, logoutAdmin } = useGame(); // [NEW] Use Context
    // Auth State
    const [user, setUser] = useState(null); // { username, role } logic kept for UI state for now, but sync with login
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Data State
    const [teams, setTeams] = useState([]);
    const [newTeam, setNewTeam] = useState({ name: "", balance: 10000 });
    const [admins, setAdmins] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "", role: "admin" });

    const containerRef = useRef(null);

    // --- INITIAL DATA FETCH ---
    const fetchData = async () => {
        try {
            const [teamsRes] = await Promise.all([
                axios.get(API_URL)
            ]);
            setTeams(teamsRes.data);

            // If root, fetch admins too
            if (user?.role === "root") {
                const adminsRes = await axios.get(ADMIN_API);
                setAdmins(adminsRes.data);
            }
        } catch (err) {
            console.error("Failed to fetch data");
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
            const userData = await loginAdmin({ username, password }); // [NEW] Use Context
            if (userData.success) {
                setUser(userData.user);
            }
        } catch (err) {
            alert("Invalid Creds");
        }
    };

    const handleLogout = async () => {
        if (user) await logoutAdmin(user.username); // [NEW] Use Context
        setUser(null);
        setPassword("");
    };

    // --- TEAM ACTIONS ---
    const addTeam = async (e) => {
        e.preventDefault();
        if (!newTeam.name) return;
        try {
            await axios.post(API_URL, newTeam);
            setNewTeam({ name: "", balance: 10000 });
            fetchData();
        } catch (err) { console.error("Error adding team"); }
    };

    const deleteTeam = async (id) => {
        if (!window.confirm("Delete team?")) return;
        try { await axios.delete(`${API_URL}/${id}`); fetchData(); } catch (err) { }
    };

    const updateBalance = async (id, current, amount) => {
        try { await axios.put(`${API_URL}/${id}`, { balance: current + amount }); fetchData(); } catch (err) { }
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
            await axios.put("http://localhost:5000/api/state", { isGameActive: true, startedByAdminId: user.id });
            alert("Game Started! Lost money will be credited to your account.");
            navigate("/game"); // [NEW] Auto-navigate
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
            alert(err.response?.data?.error || "Failed to add resource"); // Show backend error message (Limits)
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
                    <span className="user-badge">LOGGED IN AS: {user.username.toUpperCase()} ({user.role.toUpperCase()})</span>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr key={team._id}>
                                            <td className="team-name">{team.name}</td>
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
