
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ADMIN_API = "/api/admin";

export default function AdminLogin() {
    const navigate = useNavigate();
    const { loginAdmin } = useGame(); // Use context logic which works with new session
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await loginAdmin({ username, password });
            // Context handles state update.
            // Role based redirect:
            // If already handled in context, navigate.
            // But context might not redirect. 
            // We can check user role from response or context.
            // However, context loginAdmin now returns the User object (Step 205).

            // Re-fetch me to be sure of role/room? 
            // Better: use the response from loginAdmin
            // wait, loginAdmin in GameContext returns res.data

            navigate("/admin"); // Redirect to Dashboard first, let Dashboard handle sub-redirects?
            // Requirement: "Redirect directly to GAME PAGE if Admin"
            // But we need to separate Admin vs Root.
            // We can do this in the Dashboard (Admin.jsx) which checks role on mount?
            // Or do it here.

            // Let's rely on Admin.jsx to route correctly upon mount, 
            // OR navigate to /admin and let it decide.
        } catch (err) {
            setError(err.response?.data?.error || "Login Failed");
        }
    };

    return (
        <div className="admin-login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <form onSubmit={handleLogin} className="login-box glass-panel" style={{ width: '400px', padding: '40px' }}>
                <h2 style={{ textAlign: 'center', color: '#ffd700', marginBottom: '30px' }}>SECURE LOGIN</h2>

                {error && <div style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '5px' }}>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white' }}
                        autoFocus
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '5px' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white' }}
                    />
                </div>

                <button type="submit" className="btn-purple" style={{ width: '100%', padding: '15px', fontSize: '1.2rem' }}>
                    AUTHENTICATE
                </button>
            </form>
        </div>
    );
}
