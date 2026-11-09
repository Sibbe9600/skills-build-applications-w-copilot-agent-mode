import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members?: string[] };

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    path="/api/teams"
    dataKey="teams"
    emptyMessage="No teams yet."
    renderItems={(teams) => <ul className="list-group">{teams.map((team, index) =>
      <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
        <strong>{team.name}</strong>{team.mascot ? ` · ${team.mascot}` : ''}
        {team.members?.length ? <div>Members: {team.members.join(', ')}</div> : null}
      </li>)}</ul>}
  />;
}
