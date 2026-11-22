import { inr } from "../lib/format";
import type { Hotel, Saving } from "../lib/types";
import HotelImage from "./HotelImage";

interface Props {
  hotel: Hotel;
  saving?: Saving; // present only when BOTH suppliers listed this hotel
  isCheapest: boolean;
  favorite: boolean;
  index: number;
  onToggleFavorite: () => void;
}

// Only data from the API is shown: name, price, supplier, commissionPct.
// The picture is just decoration; its colour comes from the hotel name.
const hueOf = (name: string) => name.toLowerCase().split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

// Say only what is true: "compared" is only correct if both suppliers had this hotel
function compareLine(hotel: Hotel, saving?: Saving) {
  if (!saving) return `Only listed by ${hotel.supplier}`;
  if (saving.saved > 0) return `✓ ${inr(saving.saved)} cheaper than ${saving.otherSupplier}`;
  return "✓ Same price on both suppliers";
}

export default function HotelCard({ hotel, saving, isCheapest, favorite, index, onToggleFavorite }: Props) {
  return (
    <article className="hcard" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <HotelImage hue={hueOf(hotel.name)}>
        {isCheapest && <span className="ribbon">Lowest price</span>}
        <button className={`fav ${favorite ? "on" : ""}`} aria-pressed={favorite}
          aria-label={favorite ? `Remove ${hotel.name} from saved` : `Save ${hotel.name}`} onClick={onToggleFavorite}>
          {favorite ? "♥" : "♡"}
        </button>
      </HotelImage>

      <div className="hbody">
        <h3 className="hname">{hotel.name}</h3>
        <div className={`okline ${saving ? "" : "single"}`}>{compareLine(hotel, saving)}</div>
        <div className="tags">
          <span className={`tag ${hotel.supplier === "Supplier A" ? "sup-a" : "sup-b"}`}>{hotel.supplier}</span>
          <span className="tag">Commission {hotel.commissionPct}%</span>
        </div>
      </div>

      <div className="hprice">
        <span className="plabel">Best price</span>
        <span className="pnow">{inr(hotel.price)}</span>
      </div>
    </article>
  );
}
