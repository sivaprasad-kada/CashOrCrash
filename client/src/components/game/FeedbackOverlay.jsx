import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGame } from "../../context/GameContext";

export default function FeedbackOverlay() {
    const { questionResults, bidState, activeTeam, setShowOnlySelected } = useGame();
    const overlayRef = useRef(null);
    const textRef = useRef(null);

    const questionId = bidState.questionId;
    const result = questionResults[questionId];

    useEffect(() => {
        if (!result) {
            // Reset if no result (hidden)
            gsap.set(overlayRef.current, { display: "none", opacity: 0 });
            return;
        }

        // --- ANIMATION START ---
        const overlay = overlayRef.current;
        const text = textRef.current;

        // 1. Show Overlay
        gsap.set(overlay, { display: "flex", opacity: 1 });

        if (result === "correct") {
            // SUCCESS ANIMATION
            overlay.style.background = "rgba(46, 204, 113, 0.9)"; // var(--success)

            // Text Slam
            gsap.fromTo(text,
                { scale: 5, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: "bounce.out" }
            );

            // Confetti / Particles (Simulated with simple dom elements if complex, 
            // but for now just text bounce and bg pulse)
            gsap.to(overlay, {
                background: "rgba(46, 204, 113, 0.6)",
                repeat: 3,
                yoyo: true,
                duration: 0.2
            });

        } else if (result === "wrong") {
            // FAIL ANIMATION
            overlay.style.background = "rgba(239, 68, 68, 0.9)"; // var(--danger)

            // Screen Shake
            gsap.fromTo(overlay,
                { x: -50 },
                { x: 50, duration: 0.1, repeat: 5, yoyo: true, ease: "linear" }
            );

            // Text Drop
            gsap.fromTo(text,
                { y: -500, rotation: 20 },
                { y: 0, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" }
            );
        }

        // Auto Hide after 3 seconds
        setTimeout(() => {
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    gsap.set(overlay, { display: "none" });
                    setShowOnlySelected(false); // Reset board view
                }
            });
        }, 3000);

    }, [result]);

    if (!result) return <div ref={overlayRef} style={{ display: 'none' }} />;

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                display: 'none', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', color: 'white'
            }}
        >
            <h1 ref={textRef} style={{ fontSize: '6rem', fontWeight: 900, textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {result === "correct" ? "ACCEPTED" : "CRASHED"}
            </h1>
            <p style={{ fontSize: '2rem', marginTop: '20px' }}>
                {result === "correct" ? `+₹${bidState.amount}` : `-₹${bidState.amount}`}
            </p>
        </div>
    );
}
