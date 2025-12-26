import { useGame } from "../../context/GameContext";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function LifelineDisplay() {
  const { activeTeam, selectedQuestion } = useGame();
  const barsRef = useRef([]);

  if (!activeTeam) {
    return <div className="lifeline-box disabled">Select a squad...</div>;
  }

  return (
    <div className="lifeline-box">
      <div className="lifeline-title">LIFELINES</div>
      <div className="lifelines-bar-container">
        {(() => {
          const LIFELINE_KEYS = [
            { id: "50-50", label: "50-50", icon: "⚖️" },
            { id: "QUESTION-SWAP", label: "Question Swap", icon: "🔄" },
            { id: "EXTRA-TIME", label: "Extra Time", icon: "⏳" }
          ];

          return LIFELINE_KEYS.map((item, i) => {
            // Find usage in team
            const lifelineObj = activeTeam?.lifelines?.find(l => l.hasOwnProperty(item.id));
            const isUsed = lifelineObj ? lifelineObj[item.id] === true : false;

            // Global limit check
            const totalUsed = activeTeam?.lifelines?.reduce((acc, curr) => acc + (Object.values(curr)[0] === true ? 1 : 0), 0) || 0;
            const isLockedByMax = !isUsed && totalUsed >= 2;

            return (
              <div
                key={item.id}
                className={`lifeline-status-card ${isUsed ? "used" : (isLockedByMax ? "locked-rule" : "available")} ${item.id.toLowerCase()}`}
                ref={el => barsRef.current[i] = el}
              >
                <div className="lifeline-icon-large">{item.icon}</div>
                <span className="lifeline-name">{item.label}</span>
                <div className="status-indicator">
                  {isUsed ? "USED" : (isLockedByMax ? "LOCKED" : "READY")}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}


