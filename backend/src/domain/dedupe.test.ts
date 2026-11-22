import { describe, expect, it } from "vitest";
import { dedupeBestOffers } from "./dedupe";
import type { Hotel } from "./types";

const h = (name: string, price: number, supplier: string, commissionPct = 10): Hotel => ({
  name, price, supplier, commissionPct,
});

describe("dedupeBestOffers", () => {
  it("keeps the cheaper offer when both suppliers have the hotel", () => {
    const { hotels } = dedupeBestOffers([h("Holtin", 6000, "Supplier A"), h("Holtin", 5340, "Supplier B", 20)]);
    expect(hotels).toEqual([h("Holtin", 5340, "Supplier B", 20)]);
  });

  it("keeps hotels that only one supplier has", () => {
    const { hotels } = dedupeBestOffers([h("Taj", 9000, "Supplier A"), h("Oberoi", 8000, "Supplier B")]);
    expect(hotels.map((x) => x.name)).toEqual(["Oberoi", "Taj"]);
  });

  it("matches names case-insensitively and ignores extra spaces", () => {
    const { hotels } = dedupeBestOffers([h("Taj Palace", 9000, "Supplier A"), h("  taj   palace ", 9200, "Supplier B")]);
    expect(hotels).toHaveLength(1);
    expect(hotels[0].supplier).toBe("Supplier A");
  });

  it("is stable on equal prices (Supplier A wins)", () => {
    const { hotels } = dedupeBestOffers([h("X", 100, "Supplier B"), h("X", 100, "Supplier A")]);
    expect(hotels[0].supplier).toBe("Supplier A");
  });

  it("reports how much was saved versus the other supplier", () => {
    const { savings } = dedupeBestOffers([h("Holtin", 6000, "Supplier A"), h("Holtin", 5340, "Supplier B")]);
    expect(savings).toEqual([
      { name: "Holtin", chosenSupplier: "Supplier B", chosenPrice: 5340, otherSupplier: "Supplier A", otherPrice: 6000, saved: 660 },
    ]);
  });

  it("returns empty results for empty input", () => {
    expect(dedupeBestOffers([])).toEqual({ hotels: [], savings: [] });
  });
});
