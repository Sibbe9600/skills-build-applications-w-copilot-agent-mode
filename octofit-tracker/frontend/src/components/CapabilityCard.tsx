import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  dataKey: string;
  emptyMessage: string;
  renderItems: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, dataKey, emptyMessage, renderItems }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setItems(null);
    setFailed(false);
    getJson<Record<string, T[]>>(path)
      .then((response) => {
        const result = response[dataKey];
        if (!Array.isArray(result)) throw new Error('Invalid API response');
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => { active = false; };
  }, [dataKey, path]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {failed
      ? <p role="alert">Unable to load {title.toLowerCase()}.</p>
      : items === null
        ? <p role="status">Loading {title.toLowerCase()}...</p>
        : items.length === 0
          ? <p>{emptyMessage}</p>
          : renderItems(items)}
  </div></section>;
}
