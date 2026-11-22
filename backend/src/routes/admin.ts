import { Router } from "express";
import { AppError } from "../middleware/error";
import { resetSuppliers, supplierState } from "../suppliers/state";
import { supplierPatch } from "./schemas";

// Failure simulation for demos / Postman. Disable with ENABLE_ADMIN=false
export function createAdminRouter() {
  const router = Router();

  router.get("/admin/suppliers", (_req, res) => res.json(supplierState));

  router.post("/admin/suppliers/reset", (_req, res) => {
    resetSuppliers();
    res.json(supplierState);
  });

  router.put("/admin/suppliers/:code", (req, res) => {
    const code = req.params.code.toUpperCase();
    if (code !== "A" && code !== "B") throw new AppError(400, "code must be A or B");
    Object.assign(supplierState[code], supplierPatch.parse(req.body));
    res.json(supplierState[code]);
  });

  return router;
}
