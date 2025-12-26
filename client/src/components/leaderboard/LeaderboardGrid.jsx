import TeamCard from "./TeamCard";

const teams = [
  { rank: 1, name: "Team Alpha", balance: 18500 },
  { rank: 2, name: "Team Beta", balance: 17200 },
  { rank: 3, name: "Team Gamma", balance: 16000 },
  { rank: 4, name: "Team Delta", balance: 14800 },
  { rank: 5, name: "Team Epsilon", balance: 13500 },
  { rank: 6, name: "Team Zeta", balance: 12200 },
  { rank: 7, name: "Team Eta", balance: 11000 },
  { rank: 8, name: "Team Theta", balance: 9800 },
  { rank: 9, name: "Team Iota", balance: 8600 },
  { rank: 10, name: "Team Kappa", balance: 7400 }
];

export default function LeaderboardGrid() {
  return (
    <div className="leaderboard-grid">
      {teams.map(team => (
        <TeamCard key={team.rank} team={team} />
      ))}
    </div>
  );
}
