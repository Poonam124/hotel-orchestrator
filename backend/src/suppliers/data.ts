import type { SupplierHotel } from "../domain/types";

type Row = [id: string, name: string, price: number, city: string, commissionPct: number];
const toHotels = (rows: Row[]): SupplierHotel[] =>
  rows.map(([hotelId, name, price, city, commissionPct]) => ({ hotelId, name, price, city, commissionPct }));

// Edit these freely. Keep some overlapping names between A and B.
export const supplierAHotels = toHotels([
  ["a1", "Holtin", 6000, "delhi", 10],
  ["a2", "Radison", 5900, "delhi", 13],
  ["a3", "Taj Palace", 9000, "delhi", 15],
  ["a4", "Lemon Tree", 4200, "delhi", 12],
  ["a5", "The Leela", 11500, "delhi", 16],
  ["a6", "Zostel", 1800, "delhi", 8],
  ["a7", "Ibis", 3900, "delhi", 11],
  ["a8", "Sea Breeze", 7000, "mumbai", 11],
  ["a9", "Marine Plaza", 8800, "mumbai", 14],
  ["a10", "Trident", 10500, "mumbai", 15],
  ["a11", "Zostel", 1500, "mumbai", 9],
  ["a12", "Windsor Manor", 7600, "bangalore", 12],
  ["a13", "Lalit Ashok", 6900, "bangalore", 13],
  ["a14", "Ibis", 3600, "bangalore", 10],
]);

export const supplierBHotels = toHotels([
  ["b1", "Holtin", 5340, "delhi", 20],
  ["b2", "Radison", 6200, "delhi", 9],
  ["b3", "Oberoi", 8000, "delhi", 14],
  ["b4", "Lemon Tree", 4000, "delhi", 18],
  ["b5", "taj palace", 9200, "delhi", 12],
  ["b6", "Zostel", 1650, "delhi", 10],
  ["b7", "Ibis", 4100, "delhi", 9],
  ["b8", "Sea Breeze", 6800, "mumbai", 10],
  ["b9", "Trident", 10900, "mumbai", 12],
  ["b10", "Hotel Sahara", 5200, "mumbai", 13],
  ["b11", "Windsor Manor", 7400, "bangalore", 15],
  ["b12", "Taj West End", 12000, "bangalore", 17],
  ["b13", "Ibis", 3700, "bangalore", 8],
]);
