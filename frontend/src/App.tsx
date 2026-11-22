import { useEffect, useMemo, useRef, useState } from "react";
import { Filters, SearchBar } from "./components/FilterBar";
import Header, { Theme } from "./components/Header";
import History from "./components/History";
import Results, { EmptyState, Skeletons } from "./components/Results";
import StatusBar from "./components/StatusBar";
import { useDebounce } from "./hooks/useDebounce";
import { useHealth } from "./hooks/useHealth";
import { useHotelSearch } from "./hooks/useHotelSearch";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { DEBOUNCE_MS, PRICE_MAX, PRICE_MIN } from "./lib/constants";
import type { Hotel, HistoryItem, SearchParams, SortKey, ViewMode } from "./lib/types";

const SORTS: [SortKey, string][] = [
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["commission_desc", "Commission"],
  ["name_asc", "Name: A to Z"],
];

export default function App() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "system");
  const [view, setView] = useLocalStorage<ViewMode>("view", "list");
  const [favorites, setFavorites] = useLocalStorage<string[]>("favorites", []);

  const [cityInput, setCityInput] = useState("delhi");
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sort, setSort] = useState<SortKey>("price_asc");
  const [supplier, setSupplier] = useState<"all" | "A" | "B">("all");
  const [onlyFav, setOnlyFav] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile only
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const historyId = useRef(0);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // ---- GET /api/hotels?city=..&minPrice=..&maxPrice=.. (price filter runs inside Redis) ----
  const city = useDebounce(cityInput.trim().toLowerCase(), DEBOUNCE_MS);
  const min = useDebounce(minPrice, DEBOUNCE_MS);
  const max = useDebounce(maxPrice, DEBOUNCE_MS);

  const params = useMemo<SearchParams>(
    () => ({
      city,
      minPrice: min > PRICE_MIN ? min : undefined,
      maxPrice: max < PRICE_MAX ? max : undefined,
    }),
    [city, min, max]
  );

  const { data, loading, error, ms, reload } = useHotelSearch(params, city.length > 0);
  const { health } = useHealth();

  useEffect(() => {
    if (!data || ms === null) return;
    setHistory((h) =>
      [{ id: ++historyId.current, city, count: data.hotels.length, ms, source: data.source,
         at: new Date().toLocaleTimeString() }, ...h].slice(0, 8)
    );
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- sorting and the extra filters happen in the browser ----
  const favKey = (h: Hotel) => `${city}|${h.name.trim().toLowerCase()}`;
  const isFavorite = (h: Hotel) => favorites.includes(favKey(h));
  const toggleFavorite = (h: Hotel) =>
    setFavorites((f) => (f.includes(favKey(h)) ? f.filter((k) => k !== favKey(h)) : [...f, favKey(h)]));

  const shown = useMemo(() => {
    let list = [...(data?.hotels ?? [])];
    if (onlyFav) list = list.filter((h) => favorites.includes(favKey(h)));
    if (supplier !== "all") list = list.filter((h) => h.supplier === `Supplier ${supplier}`);
    list.sort((a, b) => {
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "commission_desc") return b.commissionPct - a.commissionPct;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      return a.price - b.price;
    });
    return list;
  }, [data, onlyFav, favorites, supplier, sort, city]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setOnlyFav(false);
    setSupplier("all");
    setSort("price_asc");
  };

  const onSearch = () => {
    reload();
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cityTitle = city ? city.replace(/\b\w/g, (c) => c.toUpperCase()) : "your city";

  return (
    <>
      <Header theme={theme} onTheme={setTheme} favCount={favorites.length}
        onlyFav={onlyFav} onToggleFav={() => setOnlyFav(!onlyFav)} />

      <section className="hero">
        <div className="hero-in">
          <h1>Best hotel price, compared for you</h1>
          <p>We check Supplier A and Supplier B and show only the cheapest offer for each hotel.</p>
        </div>
      </section>

      <div className="searchwrap">
        <SearchBar city={cityInput} onCity={setCityInput} loading={loading} onSearch={onSearch} />
      </div>

      <div className="wrap">
        <aside className={`side ${filtersOpen ? "open" : ""}`}>
          <Filters
            minPrice={minPrice} maxPrice={maxPrice}
            onMin={(n) => setMinPrice(Math.min(n, maxPrice))} onMax={(n) => setMaxPrice(Math.max(n, minPrice))}
            supplier={supplier} onSupplier={setSupplier}
            onlyFav={onlyFav} onOnlyFav={setOnlyFav} favCount={favorites.length} onClear={clearFilters}
          />
        </aside>

        <section className="content" ref={resultsRef}>
          <div className="toolbar">
            <h2>{data ? `${shown.length} hotels in ${cityTitle}` : `Hotels in ${cityTitle}`}</h2>
            <div className="spacer" />
            <button className="pill filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>⚙ Filters</button>
            <div className="view" role="group" aria-label="View">
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view">☰</button>
              <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view">▦</button>
            </div>
          </div>

          <div className="sorts" role="group" aria-label="Sort by">
            {SORTS.map(([key, label]) => (
              <button key={key} className={`pill ${sort === key ? "active" : ""}`} onClick={() => setSort(key)}>{label}</button>
            ))}
          </div>

          {error && (
            <div className="banner error" role="alert">
              {error}
              <button className="link" onClick={() => reload()}>Try again</button>
            </div>
          )}

          <StatusBar health={health} data={data} shown={shown} ms={ms} />

          {!data && loading && <Skeletons />}

          {data && shown.length > 0 && (
            <Results hotels={shown} view={view} dimmed={loading} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
          )}

          {data && shown.length === 0 && !loading && (
            <EmptyState title="No hotels found"
              text="Try delhi, mumbai or bangalore, or widen the price range."
              action={{ label: "Clear filters", run: clearFilters }} />
          )}

          <History items={history} />
        </section>
      </div>
    </>
  );
}
