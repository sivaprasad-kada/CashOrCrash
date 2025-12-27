import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TimerModal({ isOpen, onClose }) {
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const timerRef = useRef(null);

    // START TIMER
    const startTimer = () => {
        if (totalSeconds > 0) {
            setIsRunning(true);
            setIsPaused(false);
        } else {
            // creating from inputs
            const total = parseInt(minutes || 0) * 60 + parseInt(seconds || 0);
            if (total > 0) {
                setTotalSeconds(total);
                setIsRunning(true);
                setIsPaused(false);
            }
        }
    };

    // PAUSE TIMER
    const pauseTimer = () => {
        setIsPaused(true);
        setIsRunning(false);
        clearInterval(timerRef.current);
    };

    // RESET TIMER
    const resetTimer = () => {
        setIsRunning(false);
        setIsPaused(false);
        setTotalSeconds(0);
        setMinutes(0);
        setSeconds(0);
        clearInterval(timerRef.current);
    };

    // TICK
    useEffect(() => {
        if (isRunning && totalSeconds > 0) {
            timerRef.current = setInterval(() => {
                setTotalSeconds((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsRunning(false);
                        return 0; // Time's up
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning]); // Re-run effect when running state changes

    // PRESETS
    const setTime = (m, s) => {
        resetTimer();
        setMinutes(m);
        setSeconds(s);
    };

    const formatDisplay = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const isTimeUp = totalSeconds === 0 && !isRunning && !isPaused && (minutes > 0 || seconds > 0); // Logic slightly buggy if manually set 0. 

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="timer-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(5px)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.div
                        className="timer-modal-content"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        style={{
                            background: "#12091f",
                            border: "1px solid #7c3aed",
                            borderRadius: "20px",
                            padding: "30px",
                            width: "400px",
                            textAlign: "center",
                            boxShadow: "0 0 40px rgba(124, 58, 237, 0.4)",
                            position: "relative",
                        }}
                    >
                        {/* CLOSE BUTTON */}
                        <button
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: "15px",
                                right: "15px",
                                background: "transparent",
                                border: "none",
                                color: "#ff4444",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                            }}
                        >
                            ✕
                        </button>

                        <h2 style={{ color: "#fff", marginBottom: "20px" }}>⏱️ TIMER</h2>

                        {/* DISPLAY */}
                        <div
                            className="timer-display-large"
                            style={{
                                fontSize: "4rem",
                                fontWeight: "bold",
                                fontFamily: "monospace",
                                color: totalSeconds <= 10 && totalSeconds > 0 ? "#ff4444" : "#2ecc71",
                                textShadow: "0 0 20px rgba(255,255,255,0.1)",
                                margin: "20px 0",
                            }}
                        >
                            {isRunning || isPaused ? formatDisplay(totalSeconds) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                    <input
                                        type="number"
                                        value={minutes}
                                        onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                                        style={{ width: '80px', background: '#222', border: '1px solid #555', color: 'white', fontSize: '2rem', textAlign: 'center', borderRadius: '5px' }}
                                    />
                                    <span style={{ fontSize: '2rem', color: 'white' }}>:</span>
                                    <input
                                        type="number"
                                        value={seconds}
                                        onChange={(e) => setSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                                        style={{ width: '80px', background: '#222', border: '1px solid #555', color: 'white', fontSize: '2rem', textAlign: 'center', borderRadius: '5px' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* CONTROLS */}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
                            {!isRunning ? (
                                <button
                                    onClick={startTimer}
                                    style={{
                                        background: "#2ecc71",
                                        color: "black",
                                        fontWeight: "bold",
                                        padding: "10px 20px",
                                        borderRadius: "5px",
                                        border: "none",
                                    }}
                                >
                                    START
                                </button>
                            ) : (
                                <button
                                    onClick={pauseTimer}
                                    style={{
                                        background: "#f1c40f",
                                        color: "black",
                                        fontWeight: "bold",
                                        padding: "10px 20px",
                                        borderRadius: "5px",
                                        border: "none",
                                    }}
                                >
                                    PAUSE
                                </button>
                            )}

                            <button
                                onClick={resetTimer}
                                style={{
                                    background: "#e74c3c",
                                    color: "white",
                                    fontWeight: "bold",
                                    padding: "10px 20px",
                                    borderRadius: "5px",
                                    border: "none",
                                }}
                            >
                                RESET
                            </button>
                        </div>

                        {/* PRESETS */}
                        <div style={{ display: "flex", gap: "5px", justifyContent: "center", flexWrap: "wrap" }}>
                            {[30, 60, 120, 300].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setTime(Math.floor(s / 60), s % 60)}
                                    style={{
                                        background: "#333",
                                        border: "1px solid #555",
                                        color: "#ccc",
                                        fontSize: "0.8rem",
                                        padding: "5px 10px",
                                        borderRadius: "4px",
                                    }}
                                >
                                    {s >= 60 ? `${s / 60}m` : `${s}s`}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
