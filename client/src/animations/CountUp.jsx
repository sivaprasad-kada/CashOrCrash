import { useEffect, useState } from "react";

export default function CountUp({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = display;
    const diff = value - start;
    const steps = 30;
    let i = 0;

    const interval = setInterval(() => {
      i++;
      setDisplay(Math.round(start + (diff * i) / steps));
      if (i >= steps) clearInterval(interval);
    }, 20);

    return () => clearInterval(interval);
  }, [value]);

  return <span>₹{display}</span>;
}
