import type { HistoryItem } from "../lib/types";
import { titleCase } from "../lib/format";

export default function History({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <details className="panel history">
      <summary>Recent requests ({items.length})</summary>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <span>{i.at}</span>
            <strong>{titleCase(i.city)}</strong>
            <span>{i.count} hotels</span>
            <span className={`tag ${i.source === "temporal" ? "src-live" : "src-cache"}`}>
              {i.source === "temporal" ? "Temporal" : "Redis"}
            </span>
            <span className="muted">{i.ms} ms</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
