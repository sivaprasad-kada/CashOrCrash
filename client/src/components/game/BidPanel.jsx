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

  // Format number to Indian System (e.g., 1,23,456)
  const formatIndianNumber = (num) => {
    if (!num) return "";
    const x = num.toString().replace(/,/g, ""); // Remove existing commas
    const lastThree = x.substring(x.length - 3);
    const otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== "")
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    return lastThree;
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, ""); // Remove non-numeric chars
    if (val === "") {
      setBidInput("");
      return;
    }
    setBidInput(formatIndianNumber(val));
  };

  const confirmBid = () => {
    // Strip commas to get raw number
    const rawValue = bidInput.replace(/,/g, "");
    const amount = Number(rawValue);

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
          type="text"
          value={bidInput}
          onChange={handleInputChange}
          placeholder={`Max: ${activeTeam.balance}`}
          className="bid-input-large"
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
