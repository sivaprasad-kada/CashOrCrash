import { useState, useEffect } from "react";

export default function useCountUp(value) {
  const [count, setCount] = useState(value);

  useEffect(() => {
    setCount(value);
  }, [value]);

  return count;
}
