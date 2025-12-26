export default function GlowPulse({ active, children }) {
  return (
    <div className={active ? "glow" : ""}>
      {children}
    </div>
  );
}
