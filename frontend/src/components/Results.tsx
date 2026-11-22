import type { Hotel, ViewMode } from "../lib/types";
import HotelCard from "./HotelCard";

interface Props {
  hotels: Hotel[];
  view: ViewMode;
  dimmed: boolean;
  isFavorite: (h: Hotel) => boolean;
  onToggleFavorite: (h: Hotel) => void;
}

export default function Results({ hotels, view, dimmed, isFavorite, onToggleFavorite }: Props) {
  const cheapest = hotels.length ? Math.min(...hotels.map((h) => h.price)) : null;
  return (
    <div className={`results ${view} ${dimmed ? "dimmed" : ""}`}>
      {hotels.map((h, i) => (
        <HotelCard key={h.name} index={i} hotel={h} isCheapest={h.price === cheapest}
          favorite={isFavorite(h)} onToggleFavorite={() => onToggleFavorite(h)} />
      ))}
    </div>
  );
}

export function Skeletons() {
  return (
    <div className="results list" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="hcard skeleton" />)}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: { label: string; run: () => void } }) {
  return (
    <div className="empty">
      <div className="empty-ico">🧳</div>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      {action && <button className="cta" onClick={action.run}>{action.label}</button>}
    </div>
  );
}
