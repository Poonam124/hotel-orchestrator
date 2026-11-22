import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { HEALTH_POLL_MS } from "../lib/constants";
import type { Health } from "../lib/types";

export function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHealth(await api.health());
    } catch {
      setHealth(null); // API unreachable
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, HEALTH_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { health, refresh };
}
