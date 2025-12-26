import { Routes, Route } from "react-router-dom";
import { GameProvider } from "./context/GameContext";
import { SocketProvider } from "./context/SocketContext";

import Home from "./pages/Home";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import SugarCandy from "./pages/SugarCandy";

export default function App() {
  return (
    <GameProvider>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sugar-candy/:teamId" element={<SugarCandy />} />
        </Routes>
      </SocketProvider>
    </GameProvider>
  );
}
