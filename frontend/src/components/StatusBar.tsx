import { inr } from "../lib/format";
import type { Health, Hotel, Probe, SearchResult } from "../lib/types";

function SupplierChip({ label, probe }: { label: string; probe: Probe }) {
  return (
    <span className="chip">
      <span className={`dot ${probe.status}`} />
      {label}
      <span className="muted">{probe.status === "up" ? `${probe.latencyMs} ms` : "down"}</span>
    </span>
  );
}

const InfraChip = ({ label, v }: { label: string; v: "up" | "down" }) => (
  <span className="chip"><span className={`dot ${v}`} />{label}</span>
);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

interface Props {
  health: Health | null;
  data: SearchResult | null;
  shown: Hotel[];
  ms: number | null;
}

export default function StatusBar({ health, data, shown, ms }: Props) {
  const prices = shown.map((h) => h.price);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
  const down = health
    ? ([["Supplier A", health.suppliers.supplierA], ["Supplier B", health.suppliers.supplierB]] as const)
        .filter(([, p]) => p.status === "down").map(([n]) => n)
    : [];

  return (
    <div className="status">
      <div className="chips">
        {health ? (
          <>
            <SupplierChip label="Supplier A" probe={health.suppliers.supplierA} />
            <SupplierChip label="Supplier B" probe={health.suppliers.supplierB} />
            <InfraChip label="Redis" v={health.redis} />
            <InfraChip label="Temporal" v={health.temporal} />
          </>
        ) : (
          <span className="chip"><span className="dot down" />API unreachable</span>
        )}
      </div>

      {down.length > 0 && (
        <div className="banner warn" role="status">
          {down.join(" and ")} reported down. Offers from the other supplier are still shown.
        </div>
      )}

      {data && (
        <div className="stats">
          <Stat label="Hotels" value={String(shown.length)} />
          <Stat label="Cheapest" value={cheapest !== null ? inr(cheapest) : "-"} />
          <Stat label="Average" value={avg !== null ? inr(avg) : "-"} />
          <div className="stat">
            <span className="muted">Source</span>
            <strong>
              <span className={`tag ${data.source === "temporal" ? "src-live" : "src-cache"}`}>
                {data.source === "temporal" ? "Temporal workflow" : "Redis cache"}
              </span>
              {ms !== null && <span className="muted"> {ms} ms</span>}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

