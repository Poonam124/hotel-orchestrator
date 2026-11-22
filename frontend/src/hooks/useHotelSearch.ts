import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { SearchParams, SearchResult } from "../lib/types";

interface State {
  data: SearchResult | null;
  loading: boolean;
  error: string | null;
  ms: number | null;
}

// Runs automatically when `params` change and cancels the previous request.
export function useHotelSearch(params: SearchParams, enabled: boolean) {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null, ms: null });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!enabled) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const startedAt = performance.now();
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.hotels(params, ctrl.signal);
      setState({ data, loading: false, error: null, ms: Math.round(performance.now() - startedAt) });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, [params, enabled]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [run]);

  return { ...state, reload: run };
}