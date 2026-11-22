import { useState } from "react";
import { CITIES, PRICE_MAX, PRICE_MIN, PRICE_STEP } from "../lib/constants";
import { inr, titleCase } from "../lib/format";
import Slider from "./Slider";

const CITY_EMOJI: Record<string, string> = { delhi: "🕌", mumbai: "🌊", bangalore: "🌳" };

// ---------------- Top search card: city only (that is what the API takes) ----------------
interface SearchProps {
  city: string;
  onCity: (c: string) => void;
  loading: boolean;
  onSearch: () => void;
}

export function SearchBar({ city, onCity, loading, onSearch }: SearchProps) {
  const [open, setOpen] = useState(false);
  const matches = CITIES.filter((c) => c.includes(city.trim().toLowerCase()));

  return (
    <>
      <form className="search one" onSubmit={(e) => { e.preventDefault(); setOpen(false); onSearch(); }}>
        <div className="sfield">
          <label htmlFor="city">City</label>
          <input id="city" value={city} autoComplete="off" placeholder="Where to? e.g. delhi"
            onChange={(e) => onCity(e.target.value)}
            onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} />
          <small>{titleCase(city.trim() || "Type a city")}</small>
          {open && matches.length > 0 && (
            <div className="suggest" role="listbox">
              {matches.map((c) => (
                <button type="button" key={c} onMouseDown={() => { onCity(c); setOpen(false); }}>
                  <span>{CITY_EMOJI[c] ?? "📍"}</span> {titleCase(c)}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="sbtn" type="submit" disabled={loading}>{loading ? "Searching..." : "SEARCH"}</button>
      </form>

      <div className="quick">
        <span className="muted">Popular:</span>
        {CITIES.map((c) => (
          <button key={c} className={`pill ${city.trim().toLowerCase() === c ? "active" : ""}`} onClick={() => onCity(c)}>
            {CITY_EMOJI[c]} {titleCase(c)}
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------- Left sidebar filters ----------------
interface FilterProps {
  minPrice: number; maxPrice: number; onMin: (n: number) => void; onMax: (n: number) => void;
  supplier: "all" | "A" | "B"; onSupplier: (s: "all" | "A" | "B") => void;
  onlyFav: boolean; onOnlyFav: (b: boolean) => void; favCount: number;
  onClear: () => void;
}

export function Filters(p: FilterProps) {
  const label = (n: number, edge: number) => (n === edge ? "Any" : inr(n));
  return (
    <div className="panel filters">
      <div className="fh"><h2>Filters</h2><button className="link-btn" onClick={p.onClear}>Clear all</button></div>

      <div className="fgroup">
        <h3>Price range</h3>
        <Slider live label="Min" value={p.minPrice} min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
          format={(n) => label(n, PRICE_MIN)} onChange={p.onMin} />
        <Slider live label="Max" value={p.maxPrice} min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
          format={(n) => label(n, PRICE_MAX)} onChange={p.onMax} />
        <span className="muted">Filtered inside Redis by the API.</span>
      </div>

      <div className="fgroup">
        <h3>Chosen supplier</h3>
        <div className="chips">
          {(["all", "A", "B"] as const).map((s) => (
            <button key={s} className={`pill ${p.supplier === s ? "active" : ""}`} onClick={() => p.onSupplier(s)}>
              {s === "all" ? "All" : `Supplier ${s}`}
            </button>
          ))}
        </div>
      </div>

      <label className="tick">
        <input type="checkbox" checked={p.onlyFav} onChange={(e) => p.onOnlyFav(e.target.checked)} />
        Saved hotels only ({p.favCount})
      </label>
    </div>
  );
}
