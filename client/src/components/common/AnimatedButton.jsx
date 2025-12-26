import useClickAnimation from "../../hooks/useClickAnimation";

export default function AnimatedButton({ children, onClick }) {
  const ripple = useClickAnimation();

  return (
    <button
      onClick={(e) => {
        ripple(e);
        onClick && onClick();
      }}
      className="glow"
    >
      {children}
    </button>
  );
}
