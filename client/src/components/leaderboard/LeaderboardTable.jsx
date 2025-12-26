import LeaderboardRow from "./LeaderboardRow";

const dummyData = [
  { name: "Team Alpha", balance: 14000 },
  { name: "Team Beta", balance: 12200 },
  { name: "Team Gamma", balance: 11000 },
  { name: "Team Delta", balance: 9800 },
  { name: "Team Epsilon", balance: 8700 },
  { name: "Team Zeta", balance: 7600 },
  { name: "Team Eta", balance: 6900 },
  { name: "Team Theta", balance: 6100 },
  { name: "Team Iota", balance: 5200 },
  { name: "Team Kappa", balance: 4500 },
];

export default function LeaderboardTable() {
  return (
    <div className="glass leaderboard-table">
      {dummyData.map((team, i) => (
        <LeaderboardRow
          key={team.name}
          rank={i + 1}
          team={team}
        />
      ))}
    </div>
  );
}
