export default function useFallingAnimation(count = 30) {
  return Array.from({ length: count }).map(() => ({
    left: Math.random() * 100 + "%",
    duration: 6 + Math.random() * 8 + "s",
    delay: Math.random() * 5 + "s",
  }));
}
