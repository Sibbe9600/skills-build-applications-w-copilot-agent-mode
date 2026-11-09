import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

export default function Workouts() {
  return <CapabilityCard<Suggestion>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    dataKey="suggestions"
    emptyMessage="No workout suggestions yet."
    renderItems={(suggestions) => <ul className="list-group">{suggestions.map((suggestion, index) =>
      <li className="list-group-item" key={`${suggestion.title}-${index}`}>
        <strong>{suggestion.title}</strong>
        {suggestion.focus ? <div>{suggestion.focus}{suggestion.minutes ? ` · ${suggestion.minutes} min` : ''}{suggestion.difficulty ? ` · ${suggestion.difficulty}` : ''}</div> : null}
        {suggestion.reason ? <p className="mb-0">{suggestion.reason}</p> : null}
      </li>)}</ul>}
  />;
}
