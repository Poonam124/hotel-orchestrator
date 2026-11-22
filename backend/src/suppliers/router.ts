import { Router } from "express";
import type { SupplierCode, SupplierHotel } from "../domain/types";
import { supplierAHotels, supplierBHotels } from "./data";
import { supplierState } from "./state";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createSupplierRouter(random: () => number = Math.random) {
  const router = Router();

  const serve = (code: SupplierCode, data: SupplierHotel[]) => {
    router.get(`/supplier${code}/hotels`, async (req, res) => {
      const state = supplierState[code];
      if (state.delayMs > 0) await sleep(state.delayMs);
      if (state.down || random() * 100 < state.failureRate) {
        return res.status(503).json({ error: `Supplier ${code} is unavailable` });
      }
      const city = String(req.query.city ?? "").trim().toLowerCase();
      res.json(city ? data.filter((h) => h.city === city) : data);
    });
  };

  serve("A", supplierAHotels);
  serve("B", supplierBHotels);
  return router;
}
