import { motion } from "framer-motion";

export default function TeamCard({ team }) {
  return (
    <motion.div
      className={`team-card ${team.rank === 1 ? "winner" : ""}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: team.rank * 0.05 }}
    >
      <div className="team-rank">
        {team.rank === 1 ? "👑" : `#${team.rank}`}
      </div>

      <div className="team-avatar">
        {team.name.charAt(0)}
      </div>

      <div className="team-name">{team.name}</div>
      <div className="team-balance">₹{team.balance}</div>
    </motion.div>
  );
}
