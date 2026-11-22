import { useEffect, useState } from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (n: number) => string;
  // "live" calls onChange while dragging; otherwise only when released
  live?: boolean;
  onChange: (n: number) => void;
}

export default function Slider({ label, value, min, max, step, format = String, live, onChange }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  const set = (n: number) => {
    setLocal(n);
    if (live) onChange(n);
  };
  const commit = () => {
    if (!live) onChange(local);
  };

  return (
    <label className="slider">
      <span>
        {label} <b>{format(local)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={(e) => set(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
    </label>
  );
}
