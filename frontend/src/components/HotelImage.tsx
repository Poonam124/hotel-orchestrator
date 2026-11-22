import type { CSSProperties, ReactNode } from "react";

interface Props {
  hue: number; // 0-359, comes from the hotel name so every hotel keeps its own colour
  children?: ReactNode; // badges / buttons drawn on top of the picture
}

// Decorative skyline, not a real photo. Colours come from CSS (see .himg in styles.css).
export default function HotelImage({ hue, children }: Props) {
  return (
    <div className="himg" style={{ "--hue": hue } as CSSProperties}>
      <svg className="himg-art" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice"
        aria-hidden="true" focusable="false">
        <rect className="sky" width="200" height="120" />
        <circle className="sun" cx="158" cy="30" r="13" />
        <rect className="b1" x="18" y="58" width="44" height="62" />
        <rect className="b2" x="68" y="36" width="52" height="84" />
        <rect className="b3" x="126" y="66" width="40" height="54" />
        <g className="win">
          <rect x="26" y="68" width="8" height="8" /><rect x="46" y="68" width="8" height="8" />
          <rect x="26" y="88" width="8" height="8" /><rect x="46" y="88" width="8" height="8" />
          <rect x="78" y="48" width="8" height="8" /><rect x="102" y="48" width="8" height="8" />
          <rect x="78" y="72" width="8" height="8" /><rect x="102" y="72" width="8" height="8" />
          <rect x="90" y="96" width="8" height="8" />
          <rect x="134" y="76" width="8" height="8" /><rect x="152" y="76" width="8" height="8" />
          <rect x="134" y="94" width="8" height="8" />
        </g>
      </svg>
      {children}
    </div>
  );
}
