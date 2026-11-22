import type { SupplierCode } from "../domain/types";

// Failure simulation knobs, changed at runtime through /admin/suppliers
export interface SupplierState {
  down: boolean;
  delayMs: number;
  failureRate: number; // 0-100 (% of requests that fail)
}

const initial = (): Record<SupplierCode, SupplierState> => ({
  A: { down: false, delayMs: 0, failureRate: 0 },
  B: { down: false, delayMs: 0, failureRate: 0 },
});

export const supplierState = initial();

export function resetSuppliers() {
  Object.assign(supplierState, initial());
}
