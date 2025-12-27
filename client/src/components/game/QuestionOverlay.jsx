import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { submitAnswer } from "../../services/game.api";
import gsap from "gsap";

export default function QuestionOverlay() {
    const {
        bidState,
        revealQuestion,
        activeTeam,
        selectedQuestion,
        questionResults,
        consumeLifeline,
        useLifeline,
        setQuestionResults,
        setBidState,
        setShowOnlySelected,
        setRevealQuestion,
        clearCurrentQuestion,
        localFiftyFifty, // [NEW]
        setLocalFiftyFifty // [NEW]
    } = useGame();

    const [selectedOption, setSelectedOption] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // Default 30s
    const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null

    const timerRef = useRef(null);
    const hintRef = useRef(null);
    const optionsGridRef = useRef(null);
    const optionRefs = useRef([]);
    const confettiRef = useRef(null);

    // Check if we should be showing the overlay
    const showOverlay = revealQuestion && selectedQuestion;
    const result = selectedQuestion ? questionResults[selectedQuestion.number] : null;

    // --- PAUSE LOGIC ---
    const [isPaused, setIsPaused] = useState(false);

    // --- TIME UP LOGIC ---
    const handleTimeUp = async () => {
        clearInterval(timerRef.current);

        setFeedback("wrong"); // Trigger wrong feedback immediately

        // Call API to lock as wrong in MongoDB
        if (selectedQuestion) {
            try {
                await submitAnswer({
                    teamId: activeTeam._id,
                    questionId: selectedQuestion.number,
                    answer: "TIME_UP", // Will match as "wrong"
                    bid: bidState.amount
                });

                // Update local state immediately
                setQuestionResults(prev => ({ ...prev, [selectedQuestion.number]: "wrong" }));
            } catch (error) {
                console.error("Failed to lock question on time up:", error);
            }
        }

        // Close Overlay after delay for animation
        setTimeout(() => {
            setRevealQuestion(false);
            setShowOnlySelected(false);
            setBidState({ questionId: null, amount: null, confirmed: false });
        }, 3000);
    };

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (showOverlay && !result && !feedback && timeLeft > 0 && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && !submitting && !result && !feedback) {
            handleTimeUp();
        }
        return () => clearInterval(timerRef.current);
    }, [showOverlay, result, timeLeft, isPaused, feedback]);

    // --- RESET STATE ON NEW QUESTION ---
    useEffect(() => {
        if (showOverlay) {
            setSelectedOption(null);
            setSubmitting(false);
            setTimeLeft(selectedQuestion?.timeLimit || 30); // [NEW] Dynamic Time Limit
            setIsPaused(false);
            setFeedback(null);

            // Reset animation states
            // Reset animation states
            const validRefs = optionRefs.current.filter(el => el);
            if (validRefs.length) {
                gsap.set(validRefs, { clearProps: "all" });
            }
        }
    }, [selectedQuestion?.id, showOverlay]);

    // Determine critical time state
    const isCriticalTime = timeLeft <= 10;

    // --- FEEDBACK ANIMATIONS ---
    useEffect(() => {
        if (!feedback) return;

        if (feedback === "correct") {
            // Confetti Animation
            if (confettiRef.current) {
                // Simple particle burst
                for (let i = 0; i < 50; i++) {
                    const el = document.createElement("div");
                    el.classList.add("confetti-particle");
                    el.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    confettiRef.current.appendChild(el);

                    gsap.fromTo(el, {
                        x: 0,
                        y: 0,
                        scale: Math.random() + 0.5
                    }, {
                        x: (Math.random() - 0.5) * 500,
                        y: (Math.random() - 0.5) * 500,
                        rotation: Math.random() * 720,
                        duration: 2.5 + Math.random(), // Slower confetti
                        ease: "power2.out",
                        opacity: 0
                    });
                }
            }
            // Slower text pop
            gsap.fromTo(".feedback-text", { scale: 0, rotation: -20 }, { scale: 1.5, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" });

        } else if (feedback === "wrong") {
            // Shake and Red Flash
            gsap.fromTo(".question-overlay-container",
                { x: -20 },
                { x: 20, duration: 0.15, repeat: 5, yoyo: true, clearProps: "x" } // Slower shake
            );
            // Slower text zoom
            gsap.fromTo(".feedback-text", { scale: 0 }, { scale: 1.2, duration: 0.8, ease: "back.out(1.7)" });
        }

    }, [feedback]);


    // --- LIFELINE LOGIC REWRITE ---
    const [confirmLifeline, setConfirmLifeline] = useState(null);
    const [processingLifeline, setProcessingLifeline] = useState(false);

    // Track 50-50 locally for this session if needed, checking activeTeam for persistence
    // logic below in render...

    const executeLifeline = async (lifelineItem) => {
        setProcessingLifeline(true);
        setConfirmLifeline(null);

        try {
            // Optimistic? No, let's wait for server since we have confirmation
            const res = await useLifeline({
                type: lifelineItem.id, // "50-50", "QUESTION-SWAP", "EXTRA-TIME"
                teamId: activeTeam._id,
                questionId: selectedQuestion.number
            });

            // Handle Effects
            if (lifelineItem.id === "EXTRA-TIME") {
                setTimeLeft(prev => prev + 30);
            }
            if (lifelineItem.id === "QUESTION-SWAP") {
                // Clear and go back to grid
                setQuestionResults(prev => ({ ...prev, [selectedQuestion.number]: "swapped" }));
                clearCurrentQuestion();
                setTimeout(() => {
                    setRevealQuestion(false);
                    setShowOnlySelected(false);
                    setBidState({ questionId: null, amount: null, confirmed: false });
                }, 500);
            }
            if (lifelineItem.id === "50-50") {
                // Re-render will pick up used status and hide options
                // No extra imperative code needed if render logic is correct
                setLocalFiftyFifty(true); // [NEW] Activate Scoped 50-50
            }

        } catch (err) {
            console.error(err);
            alert("Failed to apply lifeline: " + (err.response?.data?.error || err.message));
        } finally {
            setProcessingLifeline(false);
        }
    };

    // --- 50-50 ANIMATION ---
    const triggerFiftyFiftyAnimation = () => {
        const qId = selectedQuestion.number;
        const correctKey = selectedQuestion.correct;
        const wrongOptions = selectedQuestion.options.filter(opt => opt !== correctKey);
        const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
        const removeTwo = shuffled.slice(0, 2);

        const targets = optionRefs.current.filter((el, index) => {
            if (!el) return false;
            const optText = selectedQuestion.options[index];
            return removeTwo.includes(optText);
        });

        if (targets.length) {
            gsap.to(targets, {
                opacity: 0.2,
                scale: 0.8,
                filter: "blur(4px)",
                pointerEvents: "none",
                duration: 1.2,
                ease: "power2.out"
            });
        }
    };

    const submit = async () => {
        if (!selectedOption || submitting || !selectedQuestion) return;

        try {
            setSubmitting(true);
            clearInterval(timerRef.current);

            // Determine local result for animation
            const isLocalCorrect = selectedOption === selectedQuestion.correct;
            setFeedback(isLocalCorrect ? "correct" : "wrong");

            const qId = selectedQuestion.number;

            const res = await submitAnswer({
                teamId: activeTeam._id,
                questionId: qId,
                answer: selectedOption,
                bid: bidState.amount
            });

            const serverResult = res.data.result;

            // Close Question & Return to Grid after Animation
            setTimeout(() => {
                setQuestionResults(prev => ({ ...prev, [qId]: serverResult }));
                setRevealQuestion(false);
                setShowOnlySelected(false);
                setBidState({ questionId: null, amount: null, confirmed: false });
            }, 3000); // 3 seconds to celebrate

        } catch (err) {
            console.error("Submit Error:", err);
            const msg = err.response?.data?.error || err.message || "Verification failed";
            alert(`Error: ${msg}`);
            setSubmitting(false);
            setFeedback(null); // Reset if error
        }
    };

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? "0" + sec : sec}`;
    };

    return (
        <AnimatePresence>
            {showOverlay && (
                <motion.div
                    className={`question-overlay-container ${isCriticalTime ? "critical-state" : ""}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="overlay-backdrop" />

                    <motion.div
                        className="overlay-content-wrapper"
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.6 }}
                    >
                        {/* TIMER HEADER (ABSOLUTE OUTSIDE SCROLL) */}
                        {!result && (
                            <div className={`timer-header ${isCriticalTime ? "pulse-anim" : ""} ${isPaused ? "paused-state" : ""}`}>
                                <span className="timer-label">{isPaused ? "PAUSED" : "TIME REMAINING"}</span>
                                <span className="timer-value">{formatTime(timeLeft)}</span>
                                <button className="timer-pause-btn" onClick={() => setIsPaused(!isPaused)}>
                                    {isPaused ? "▶" : "⏸"}
                                </button>
                            </div>
                        )}

                        {/* CLOSE BUTTON (Top Right) */}
                        <button
                            className="close-overlay-btn"
                            onClick={() => {
                                setRevealQuestion(false);
                                setShowOnlySelected(false);
                                setBidState({ questionId: null, amount: null, confirmed: false });
                            }}
                            style={{
                                position: "absolute",
                                top: "15px",
                                right: "15px",
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "#fff",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                cursor: "pointer",
                                fontSize: "1.2rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 100,
                                transition: "all 0.2s"
                            }}
                        >
                            ✕
                        </button>

                        {/* SCROLLABLE CONTENT AREA */}
                        <div className="scrollable-content">
                            {/* QUESTION CARD */}
                            <div className="question-display-card">
                                <span className="question-number-header">QUESTION {selectedQuestion.number}</span>
                                <span className="question-category-tag" style={{
                                    display: "inline-block",
                                    fontSize: "0.8rem",
                                    background: "#333",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    marginBottom: "10px",
                                    color: "#aaa",
                                    textTransform: "uppercase"
                                }}>
                                    {selectedQuestion.category || "General"}
                                </span>

                                {selectedQuestion.type === "image" && selectedQuestion.image && (
                                    <div className="question-image-container" style={{ margin: "10px 0", borderRadius: "8px", overflow: "hidden" }}>
                                        <img
                                            src={`http://localhost:5000${selectedQuestion.image}`}
                                            alt="Question"
                                            style={{ width: "100%", maxHeight: "300px", objectFit: "contain", border: "1px solid #444" }}
                                        />
                                    </div>
                                )}

                                <h3>{selectedQuestion.text}</h3>
                            </div>

                            {/* INTERACTIVE AREA */}
                            {!result && !feedback && (
                                <div className="interaction-area">
                                    {/* LIFELINES HEADER */}
                                    {/* LIFELINES HEADER */}
                                    <div className="lifelines-section">
                                        <div className="lifelines-header">LIFELINES ({activeTeam?.lifelines?.reduce((acc, curr) => acc + (Object.values(curr)[0] === true ? 1 : 0), 0) || 0}/2)</div>
                                        <div className="lifeline-row">
                                            {(() => {
                                                const LIFELINE_KEYS = [
                                                    { id: "50-50", label: "50-50", icon: "⚖️" },
                                                    { id: "QUESTION-SWAP", label: "Question Swap", icon: "🔄" },
                                                    { id: "EXTRA-TIME", label: "Extra Time", icon: "⏳" }
                                                ];

                                                return LIFELINE_KEYS.map((item) => {
                                                    // Find usage in team
                                                    // Structure: [{ "50-50": false }, ...]
                                                    const lifelineObj = activeTeam?.lifelines?.find(l => l.hasOwnProperty(item.id));
                                                    const isUsed = lifelineObj ? lifelineObj[item.id] === true : false;

                                                    // Global limit check
                                                    const totalUsed = activeTeam?.lifelines?.reduce((acc, curr) => acc + (Object.values(curr)[0] === true ? 1 : 0), 0) || 0;
                                                    const isLockedGlobally = totalUsed >= 2;

                                                    const isDisabled = isUsed || (isLockedGlobally && !isUsed);

                                                    return (
                                                        <button
                                                            key={item.id}
                                                            className={`lifeline-status-card ${isUsed ? "used" : "available"} ${item.id.toLowerCase()} ${isDisabled && !isUsed ? "locked-rule" : ""}`}
                                                            disabled={isDisabled || processingLifeline}
                                                            onClick={() => !isDisabled && setConfirmLifeline(item)}
                                                            style={{ width: "100%", padding: "12px", border: "none" }}
                                                        >
                                                            <div className="lifeline-icon-large">{item.icon}</div>
                                                            <span className="lifeline-name">{item.label}</span>
                                                            <div className="status-indicator">
                                                                {isUsed ? "USED" : (isLockedGlobally ? "LOCKED" : "READY")}
                                                            </div>
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* CONFIRMATION DIALOG */}
                                    {confirmLifeline && (
                                        <div className="overlay-backdrop" style={{ zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <div className="bid-panel">
                                                <h2>Confirm Lifeline</h2>
                                                <p>Are you sure you want to use <strong>{confirmLifeline.label}</strong>?</p>
                                                <p style={{ fontSize: "0.8rem", color: "#aaa" }}>This action cannot be undone.</p>

                                                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                                    <button
                                                        onClick={() => setConfirmLifeline(null)}
                                                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid #444" }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => executeLifeline(confirmLifeline)}
                                                        style={{ background: "#2ecc71", color: "#000" }}
                                                    >
                                                        CONFIRM
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="options-grid-responsive" ref={optionsGridRef}>
                                        {(() => {
                                            // [FIX] Use Local Scoped State for 50-50 VISIBILITY
                                            const fiftyFiftyActive = localFiftyFifty;

                                            // Calculate which indices to hide (deterministically based on question text hash or simple order)
                                            // We want to hide 2 wrong answers.
                                            let hiddenIndices = [];
                                            if (fiftyFiftyActive && selectedQuestion) {
                                                let count = 0;
                                                selectedQuestion.options.forEach((opt, idx) => {
                                                    if (count < 2 && opt !== selectedQuestion.correct) {
                                                        hiddenIndices.push(idx);
                                                        count++;
                                                    }
                                                });
                                            }

                                            return selectedQuestion.options.map((opt, index) => {
                                                const uniqueKey = opt;
                                                const isHidden = hiddenIndices.includes(index);

                                                // [FIX] Remove from DOM if hidden (Requirement: "REMOVE... completely")
                                                if (isHidden) return null;

                                                return (
                                                    <button
                                                        key={index}
                                                        data-option={uniqueKey}
                                                        ref={el => optionRefs.current[index] = el}
                                                        className={`option-btn ${selectedOption === uniqueKey ? "selected" : ""}`}
                                                        onClick={() => setSelectedOption(uniqueKey)}
                                                        disabled={submitting}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>

                                    <div className="action-row">
                                        <button onClick={submit} disabled={submitting || !selectedOption} className="submit-answer-btn">
                                            {submitting ? "VERIFYING..." : "LOCK ANSWER"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FEEDBACK ANIMATION OVERLAY */}
                            {feedback && (
                                <div className={`feedback-overlay ${feedback}`}>
                                    <h1 className="feedback-text">
                                        {feedback === "correct" ? "🎉 CORRECT! 🎉" : "❌ WRONG! ❌"}
                                    </h1>
                                    {feedback === "correct" && <div className="confetti-container" ref={confettiRef}></div>}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
