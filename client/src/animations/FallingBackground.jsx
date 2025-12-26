import "../styles/background.css";

export default function FallingBackground() {
  return (
    <div className="falling-bg">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="falling-item"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`
          }}
        >
          {Math.random() > 0.5 ? "₹" : "?"}
        </span>
      ))}
    </div>
  );
}
