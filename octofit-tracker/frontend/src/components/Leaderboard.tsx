import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<Entry>
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    dataKey="leaderboard"
    emptyMessage="No leaderboard scores yet."
    renderItems={(entries) => <ol className="list-group list-group-numbered">{entries.map((entry) =>
      <li className="list-group-item" key={entry.rank}>
        {entry.teamName} · {entry.totalPoints} points
      </li>)}</ol>}
  />;
}
