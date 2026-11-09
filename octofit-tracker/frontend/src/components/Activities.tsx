import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  return <CapabilityCard<Activity>
    title="Activities"
    description="Track student activity minutes and points."
    path="/api/activities"
    dataKey="activities"
    emptyMessage="No activities yet."
    renderItems={(activities) => <ul className="list-group">{activities.map((activity, index) =>
      <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
        {activity.type} · {activity.minutes} min · {activity.points} points
      </li>)}</ul>}
  />;
}
