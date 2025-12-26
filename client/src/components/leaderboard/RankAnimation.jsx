import { motion } from "framer-motion";

export default function RankAnimation({ rank }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: rank * 0.05 }}
      className="rank"
    >
      {rank === 1 ? "👑" : `#${rank}`}
    </motion.div>
  );
}
