import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import type { HotelServicePort } from "../services/hotelService";
import { hotelsQuery, searchQuery } from "./schemas";

export function createHotelRouter(service: HotelServicePort) {
  const router = Router();

  // The endpoint from the assignment: returns a plain array
  router.get(
    "/api/hotels",
    asyncHandler(async (req, res) => {
      const q = hotelsQuery.parse(req.query);
      const hasFilter = q.minPrice !== undefined || q.maxPrice !== undefined;

      if (!hasFilter) {
        const result = await service.bestOffers(q.city);
        res.set("X-Data-Source", "temporal").json(result.hotels);
        return;
      }

      const result = await service.search(q.city, {
        minPrice: q.minPrice,
        maxPrice: q.maxPrice,
        sort: "price_asc",
        limit: 1000,
        offset: 0,
        refresh: false,
      });
      res.set("X-Data-Source", result.source).json(result.hotels);
    })
  );

  // Richer endpoint for the UI: sorting, paging, supplier status, savings
  router.get(
    "/api/hotels/search",
    requireAuth,
    asyncHandler(async (req, res) => {
      const q = searchQuery.parse(req.query);
      const result = await service.search(q.city, q);
      res.json(result);
    })
  );

  return router;
}
