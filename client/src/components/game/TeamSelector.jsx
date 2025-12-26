import { useGame } from "../../context/GameContext";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function TeamSelector() {
  const { teams, activeTeamId, setActiveTeamId } = useGame();
  const scrollRef = useRef(null);

  if (!teams.length) {
    return <div className="team-selector loading">Loading squads...</div>;
  }

  const handleSelect = (id) => {
    setActiveTeamId(id);
    // GSAP Pulse effect on selection
    gsap.fromTo(`.team-card-${id}`,
      { scale: 0.9, borderColor: "#fff" },
      { scale: 1.1, borderColor: "#7c3aed", duration: 0.3, yoyo: true, repeat: 1 }
    );
  };

  return (
    <div className="team-selector-container">
      <h4>SELECT SQUAD</h4>
      <div className="team-scroll-wrapper" ref={scrollRef}>
        {teams.map(team => {
          const isActive = activeTeamId === team._id;
          return (
            <motion.div
              key={team._id}
              className={`team-card team-card-${team._id} ${isActive ? "active" : ""}`}
              onClick={() => handleSelect(team._id)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="team-icon">👾</div>
              <div className="team-name">{team.name}</div>
              {isActive && <div className="active-dot" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
