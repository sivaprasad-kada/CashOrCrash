import { useEffect, useRef } from "react";
import gsap from "gsap";
import "../styles/GsapBackground.css";

export default function GsapBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Set Canvas Size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Configuration
        const speed = 1.0;
        const symbols = ["{ }", "</>", "⚡", "🧠", "💻", "1", "0", "λ", ";", "if", "var"];

        // State
        let offset = 0;
        const particles = [];

        // Create Particles (Symbols)
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * 2 + 0.5, // Depth/Speed
                size: Math.random() * 20 + 12, // Font size (12px - 32px)
                alpha: Math.random() * 0.7 + 0.3,
                symbol: symbols[Math.floor(Math.random() * symbols.length)], // Random symbol
                rotation: (Math.random() - 0.5) * 0.5, // Slight tilt
                rotationSpeed: (Math.random() - 0.5) * 0.01
            });
        }

        // Animation Loop
        const render = () => {
            // Clear with trail effect for "glitchy" look (optional, but clean clear is better for text)
            ctx.fillStyle = "#05020a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // --- Draw Cyber Grid ---
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124, 58, 237, 0.4)`; // Brighter purple
            ctx.lineWidth = 1.5;

            const horizon = canvas.height * 0.6;
            const gridSize = 60;

            // Vertical Lines
            const centerX = canvas.width / 2;
            for (let x = -canvas.width; x < canvas.width * 2; x += gridSize) {
                ctx.moveTo(x, canvas.height);
                ctx.lineTo(centerX + (x - centerX) * 0.1, horizon);
            }

            // Horizontal Lines
            offset = (offset + speed * 0.8) % gridSize;
            for (let y = canvas.height; y > horizon; y -= gridSize * 0.6) {
                let drawY = y - offset;
                if (drawY > horizon) {
                    ctx.moveTo(0, drawY);
                    ctx.lineTo(canvas.width, drawY);
                }
            }
            ctx.stroke();

            // --- Draw Floating Symbols (Brains/Code) ---
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            particles.forEach(p => {
                // Move particles
                p.y -= speed * p.z;
                p.rotation += p.rotationSpeed;

                // Search / Reset
                if (p.y < -50) {
                    p.y = canvas.height + 50;
                    p.x = Math.random() * canvas.width;
                    p.symbol = symbols[Math.floor(Math.random() * symbols.length)];
                }

                // Draw Symbol
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                // Color Logic: Randomly glitch to Red or Cyan, mostly White/Purple
                const rand = Math.random();
                if (rand > 0.98) {
                    ctx.fillStyle = "#ff4d4d"; // Red glitch
                    ctx.shadowColor = "#ff4d4d";
                }
                else if (rand > 0.96) {
                    ctx.fillStyle = "#00ffff"; // Cyan glitch
                    ctx.shadowColor = "#00ffff";
                }
                else {
                    ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`; // Purple/White
                    ctx.shadowColor = "rgba(124, 58, 237, 0.8)";
                }

                ctx.font = `bold ${p.size}px "Consolas", "Courier New", monospace`;
                ctx.shadowBlur = 15;
                ctx.fillText(p.symbol, 0, 0);

                ctx.restore();
            });

            // --- Vignette Overlay ---
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, "rgba(88, 28, 135, 0.4)"); // Deep Purple at bottom
            gradient.addColorStop(1, "rgba(0,0,0,0.8)"); // Dark top
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            requestAnimationFrame(render);
        };

        const animationId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="gsap-bg" />;
}
