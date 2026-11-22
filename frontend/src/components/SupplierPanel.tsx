import type { Health, Probe, SupplierCode, SupplierState, SupplierStates } from "../lib/types";
import Slider from "./Slider";

interface CardProps {
  code: SupplierCode;
  probe?: Probe;
  state?: SupplierState;
  onChange: (patch: Partial<SupplierState>) => void;
}

function SupplierCard({ code, probe, state, onChange }: CardProps) {
  const up = probe?.status === "up";
  return (
    <div className="supplier-card">
      <div className="supplier-head">
        <span className={`dot ${probe ? (up ? "up" : "down") : ""}`} />
        <strong>Supplier {code}</strong>
        <span className="muted">{probe ? (up ? `${probe.latencyMs} ms` : "unreachable") : "checking..."}</span>
        {state && (
          <button
            role="switch"
            aria-checked={state.down}
            className={`switch ${state.down ? "on" : ""}`}
            onClick={() => onChange({ down: !state.down })}
          >
            {state.down ? "Switched off" : "Switch off"}
          </button>
        )}
      </div>
      {state && (
        <div className="supplier-controls">
          <Slider label="Delay" value={state.delayMs} min={0} max={3000} step={100} format={(n) => `${n} ms`}
            onChange={(delayMs) => onChange({ delayMs })} />
          <Slider label="Random failures" value={state.failureRate} min={0} max={100} step={10}
            format={(n) => `${n}%`} onChange={(failureRate) => onChange({ failureRate })} />
        </div>
      )}
    </div>
  );
}

interface Props {
  health: Health | null;
  states: SupplierStates | null;
  onUpdate: (code: SupplierCode, patch: Partial<SupplierState>) => void;
  onReset: () => void;
}

export default function SupplierPanel({ health, states, onUpdate, onReset }: Props) {
  const infra = (label: string, v?: "up" | "down") => (
    <span className="chip">
      <span className={`dot ${v ? v : ""}`} />
      {label}
    </span>
  );

  return (
    <section className="panel" aria-label="Suppliers and system status">
      <div className="panel-head">
        <h2>Suppliers</h2>
        <div className="chips">
          {health ? (
            <>
              {infra("Redis", health.redis)}
              {infra("Temporal", health.temporal)}
            </>
          ) : (
            <span className="chip"><span className="dot down" />API unreachable</span>
          )}
        </div>
      </div>

      <div className="supplier-grid">
        <SupplierCard code="A" probe={health?.suppliers.supplierA} state={states?.A}
          onChange={(p) => onUpdate("A", p)} />
        <SupplierCard code="B" probe={health?.suppliers.supplierB} state={states?.B}
          onChange={(p) => onUpdate("B", p)} />
      </div>

      <p className="hint">
        Try switching a supplier off or adding delay: the workflow retries, then continues with the supplier that works.
        {states && <button className="link" onClick={onReset}>Reset both</button>}
      </p>
    </section>
  );
}
