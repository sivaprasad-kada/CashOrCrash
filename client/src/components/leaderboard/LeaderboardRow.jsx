import RankAnimation from "./RankAnimation";

export default function LeaderboardRow({ rank, team }) {
  return (
    <div className="leaderboard-row">
      <RankAnimation rank={rank} />
      <span className="team-name">{team.name}</span>
      <span className="team-balance">₹{team.balance}</span>
    </div>
  );
}
