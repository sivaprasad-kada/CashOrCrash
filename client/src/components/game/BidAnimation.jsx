import { motion } from "framer-motion";

export default function BidAnimation({ amount }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1.4, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bid-animation"
    >
      ₹{amount}
    </motion.div>
  );
}
