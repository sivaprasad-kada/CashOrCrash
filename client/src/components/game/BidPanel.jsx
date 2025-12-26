import { useState, useRef } from "react";
import { useGame } from "../../context/GameContext";
import gsap from "gsap";

export default function BidPanel() {
  const {
    bidState,
    setBidState,
    activeTeam,
    setFlipAll,
    setShowOnlySelected,
    setRevealQuestion,
    setAnimationPhase
  } = useGame();

  const [bidInput, setBidInput] = useState("");
  const btnRef = useRef(null);

  if (!activeTeam || bidState.questionId === null || bidState.confirmed) {
    return null;
  }

  const confirmBid = () => {
    const amount = Number(bidInput);

    if (!amount || amount <= 0 || amount > activeTeam.balance) {
      alert("Invalid bid amount");
      return;
    }

    // --- NEW ANIMATION TRIGGER ---
    setBidState({
      questionId: bidState.questionId,
      amount,
      confirmed: true
    });

    // Start the animation sequence
    setAnimationPhase('rotate');
  };

  return (
    <div className="bid-overlay">
      <div className="bid-panel">
        <h2>LOCK BID</h2>
        <p>Targeting Question #{bidState.questionId}</p>

        <input
          type="number"
          value={bidInput}
          onChange={e => setBidInput(e.target.value)}
          placeholder={`Max: ${activeTeam.balance}`}
        />

        <button ref={btnRef} onClick={confirmBid} className="bid-btn">
          INITIATE PROTOCOL
        </button>

        {/* CANCEL BUTTON */}
        <button
          className="cancel-bid-btn"
          onClick={() => {
            // Reset Bid State to close panel and return to grid
            setBidState({ questionId: null, amount: null, confirmed: false });
            setShowOnlySelected(false); // Ensure grid comes back
          }}
        >
          ✖
        </button>
      </div>
    </div>
  );
}
