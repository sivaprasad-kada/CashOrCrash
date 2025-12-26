import { useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import gsap from "gsap";

export default function QuestionNumberGrid() {
  const {
    questions,
    setBidState,
    bidState,
    setShowOnlySelected,
    questionResults,
    loadQuestion,
    animationPhase,
    setAnimationPhase,
    setRevealQuestion
  } = useGame();

  const gridRef = useRef(null);
  const buttonRefs = useRef({});

  const handleClick = async (id) => {
    // Don't allow clicks during animation
    if (animationPhase !== 'idle') return;

    setShowOnlySelected(false);
    await loadQuestion(id);

    setBidState({
      questionId: id,
      amount: null,
      confirmed: false
    });
  };

  // --- ANIMATION SEQUENCE ---
  const cloneRef = useRef(null);

  // Cleanup clone on unmount
  useEffect(() => {
    return () => {
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (animationPhase === 'idle') {
      gsap.set(".question-number", { clearProps: "all" });
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
      return;
    }

    if (animationPhase === 'rotate') {
      // Phase 1: Rotate all cards
      const tl = gsap.timeline({
        onComplete: () => setAnimationPhase('emerge')
      });

      tl.to(".question-number", {
        rotationY: 360,
        duration: 0.8,
        stagger: 0.02,
        ease: "back.out(1.7)"
      });
    }

    if (animationPhase === 'emerge') {
      // Phase 2: Create Clone and Animate
      const selectedId = bidState.questionId;
      const targetBtn = buttonRefs.current[selectedId];

      if (targetBtn) {
        const rect = targetBtn.getBoundingClientRect();

        // Create Clone
        const clone = targetBtn.cloneNode(true);
        document.body.appendChild(clone);
        cloneRef.current = clone;

        // Position Clone exactly over original
        gsap.set(clone, {
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          zIndex: 2000,
          margin: 0,
          padding: window.getComputedStyle(targetBtn).padding, // Ensure padding matches
          borderRadius: window.getComputedStyle(targetBtn).borderRadius,
          background: window.getComputedStyle(targetBtn).background, // Grab computed background just in case
          color: "#fff", // Ensure text visible
          display: "flex", // Keep centering
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "center center"
        });

        // Hide Original
        gsap.set(targetBtn, { opacity: 0 });

        // Hide others
        gsap.to(".question-number:not(.selected-active)", {
          opacity: 0,
          scale: 0,
          duration: 0.5,
          stagger: 0.01
        });

        // Animate Clone to Center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const targetX = centerX - rect.width / 2; // Fixed position requires manual center calc
        const targetY = centerY - rect.height / 2;

        gsap.to(clone, {
          left: targetX,
          top: targetY,
          scale: 4,
          rotation: 360,
          duration: 1.2,
          ease: "power3.inOut",
          onComplete: () => setAnimationPhase('break')
        });
      } else {
        // Fallback if ref missing
        setAnimationPhase('idle');
      }
    }

    if (animationPhase === 'break') {
      // Phase 3: Break/Explode Clone
      const clone = cloneRef.current;

      if (clone) {
        const tl = gsap.timeline({
          onComplete: () => {
            setRevealQuestion(true);
            setShowOnlySelected(true);

            // Cleanup
            if (cloneRef.current) {
              cloneRef.current.remove();
              cloneRef.current = null;
            }

            // Reset Grid after delay (to ensure view has switched)
            setTimeout(() => {
              setAnimationPhase('idle');
            }, 500);
          }
        });

        // Shake
        tl.to(clone, {
          x: "+=10",
          yoyo: true,
          repeat: 5,
          duration: 0.05
        })
          // Explode
          .to(clone, {
            scale: 8,
            opacity: 0,
            filter: "blur(20px)",
            duration: 0.4,
            ease: "expo.in"
          });
      } else {
        // Restore if something went wrong
        setAnimationPhase('idle');
      }
    }

  }, [animationPhase, bidState.questionId]);

  return (
    <div className="question-grid" ref={gridRef}>
      {questions.map(q => {
        const result = questionResults[q.id];
        const isSelected = q.id === (bidState && bidState.questionId);

        return (
          <button
            key={q.id}
            ref={el => buttonRefs.current[q.id] = el}
            className={`question-number
                ${result === "correct" ? "correct" : ""}
                ${result === "wrong" ? "wrong" : ""}
                ${result === "swapped" ? "swapped" : ""}
                ${result ? "locked-state" : ""}
                ${isSelected ? "selected-active" : ""} 
              `}
            disabled={result === "correct" || result === "wrong" || result === "swapped" || animationPhase !== 'idle'}
            onClick={() => handleClick(q.id)}
          >
            {q.id}
          </button>
        );
      })}
    </div>
  );
}
