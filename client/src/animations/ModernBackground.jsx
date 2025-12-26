import { motion } from "framer-motion";
import "../styles/ModernBackground.css";

export default function ModernBackground() {
    return (
        <div className="modern-bg">
            {/* Background Gradient Blobs */}
            <motion.div
                className="blob blob-1"
                animate={{
                    x: [0, 100, -100, 0],
                    y: [0, -100, 100, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="blob blob-2"
                animate={{
                    x: [0, -120, 120, 0],
                    y: [0, 120, -80, 0],
                    scale: [1, 1.3, 0.8, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="blob blob-3"
                animate={{
                    x: [0, 150, -60, 0],
                    y: [0, 60, -150, 0],
                    scale: [1, 0.9, 1.2, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Floating Particles */}
            <div className="particles-container">
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.span
                        key={i}
                        className="particle"
                        initial={{
                            opacity: 0,
                            scale: 0,
                        }}
                        animate={{
                            y: [0, -100], // move up 100px
                            opacity: [0, 0.8, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 4 + 3, // 3-7 seconds
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5,
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>
            {/* Grid Overlay for Texture */}
            <div className="grid-overlay"></div>
        </div>
    );
}
