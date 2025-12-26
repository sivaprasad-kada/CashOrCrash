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

  useEffect(() => {

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
    navigate("/admin");
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

        <button ref={btnRef} className="play-btn" onClick={handleEnterArena}>
          ENTER ARENA
        </button>
      </div>
    </div>
  );
}
