import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import gsap from "gsap";
import GsapBackground from "../animations/GsapBackground";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const btnRef = useRef(null);
  const presentRef = useRef(null);

  // Auth State
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Should check token ideally
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in (optional)
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) setIsAuthenticated(true);

    const tl = gsap.timeline();
    gsap.set([presentRef.current, titleRef.current, subRef.current, btnRef.current], { opacity: 0 });

    tl.fromTo(presentRef.current,
      { y: -20, opacity: 0, letterSpacing: "2px" },
      { y: 0, opacity: 1, letterSpacing: "8px", duration: 1.5, ease: "power2.out" }
    )
      .fromTo(titleRef.current,
        { scale: 3, opacity: 0, filter: "blur(20px)" },
        { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1, ease: "bounce.out" },
        "-=0.5"
      )
      .fromTo(subRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.2"
      )
      .fromTo(btnRef.current,
        { scale: 0, rotation: -10 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      );

    gsap.to(titleRef.current, { y: 10, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }, []);

  const handleEnterArena = () => {
    if (isAuthenticated) {
      navigate("/game");
    } else {
      setShowLogin(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", { username, password });
      if (res.data.success) {
        localStorage.setItem("adminUser", JSON.stringify(res.data.user)); // Persist logic
        setIsAuthenticated(true);
        setShowLogin(false);
      }
    } catch (err) {
      setError("Invalid Credentials");
    }
  };

  const handleStartGame = () => {
    // Here you could call an API to 'init' the game state if needed
    navigate("/game");
  };

  return (
    <div className="home">
      <GsapBackground />
      <div className="home-container">
        <h4 ref={presentRef} className="present-text">CODING CLUB PRESENTS</h4>
        <h1 ref={titleRef} className="main-title">
          <span className="text-white">CASH</span>
          <span className="text-purple"> OR </span>
          <span className="text-red">CRASH</span>
        </h1>
        <p ref={subRef} className="sub-text">High-Intensity Competitive Quiz & Bidding Game</p>

        {!isAuthenticated ? (
          <button ref={btnRef} className="play-btn" onClick={handleEnterArena}>
            ENTER ARENA
          </button>
        ) : (
          <button ref={btnRef} className="play-btn start-game-btn" onClick={handleStartGame} style={{ background: "#2ecc71", color: "#000" }}>
            START GAME
          </button>
        )}
      </div>

      {showLogin && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="login-box" style={{ background: '#222', padding: '40px', borderRadius: '10px', width: '300px', border: '1px solid #444' }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Admin Access</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text" placeholder="Username"
                value={username} onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#333', border: 'none', color: 'white' }}
              />
              <input
                type="password" placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '20px', background: '#333', border: 'none', color: 'white' }}
              />
              {error && <p style={{ color: 'red', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</p>}
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#f1c40f', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>LOGIN</button>
              <button type="button" onClick={() => setShowLogin(false)} style={{ width: '100%', marginTop: '10px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
