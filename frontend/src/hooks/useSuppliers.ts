import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { SupplierCode, SupplierState, SupplierStates } from "../lib/types";

// Reads/updates the failure-simulation settings of the mock suppliers
export function useSuppliers(onChanged: () => void) {
  const [states, setStates] = useState<SupplierStates | null>(null);

  useEffect(() => {
    api.suppliers().then(setStates).catch(() => setStates(null));
  }, []);

  const update = useCallback(
    async (code: SupplierCode, patch: Partial<SupplierState>) => {
      setStates((s) => (s ? { ...s, [code]: { ...s[code], ...patch } } : s)); // optimistic
      try {
        const next = await api.updateSupplier(code, patch);
        setStates((s) => (s ? { ...s, [code]: next } : s));
      } finally {
        onChanged();
      }
    },
    [onChanged]
  );

  const reset = useCallback(async () => {
    setStates(await api.resetSuppliers());
    onChanged();
  }, [onChanged]);

  return { states, update, reset };
}
