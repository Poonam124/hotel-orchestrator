export type Theme = "system" | "light" | "dark";

const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const ICON: Record<Theme, string> = { system: "🌓", light: "☀️", dark: "🌙" };

interface Props {
  theme: Theme;
  onTheme: (t: Theme) => void;
  favCount: number;
  onlyFav: boolean;
  onToggleFav: () => void;
}

export default function Header({ theme, onTheme, favCount, onlyFav, onToggleFav }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-in">
        <div className="brand"><span className="logo">🏨</span>StayDeal</div>
        <div className="spacer" />
        <button className={`pill ${onlyFav ? "active" : ""}`} onClick={onToggleFav} aria-pressed={onlyFav}>
          ♥ Saved <b>{favCount}</b>
        </button>
        <button className="pill" onClick={() => onTheme(NEXT[theme])} title={`Theme: ${theme}`} aria-label="Change theme">
          {ICON[theme]}
        </button>
      </div>
    </header>
  );
}
