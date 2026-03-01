import { useCallback, useEffect, useRef, useState } from "react";

import { useAPI } from "@/browser/contexts/API";
import type { ExternalCoderWorkspace } from "@/common/orpc/schemas/coder";

/** Polling interval for external Coder workspaces (30 seconds). */
const POLL_INTERVAL_MS = 30_000;

/**
 * Fetches external Coder workspaces (not managed by Mux) when the
 * `showAllCoderWorkspaces` config flag is enabled on the backend.
 * Polls on an interval. The backend short-circuits to an empty list
 * when the feature is disabled, so this hook just calls unconditionally.
 *
 * Returns an empty array when coder is unavailable or the feature is off.
 */
export function useExternalCoderWorkspaces(): {
  workspaces: ExternalCoderWorkspace[];
  error: string | null;
  refresh: () => void;
} {
  const { api } = useAPI();
  const [workspaces, setWorkspaces] = useState<ExternalCoderWorkspace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!api?.coder?.listExternalWorkspaces) {
      return;
    }

    try {
      const result = await api.coder.listExternalWorkspaces();
      if (result.ok) {
        setWorkspaces(result.workspaces);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch {
      // Best-effort — don't break the sidebar if the call fails
      setError("Failed to fetch external Coder workspaces");
    }
  }, [api]);

  useEffect(() => {
    void fetchWorkspaces();

    intervalRef.current = setInterval(() => {
      void fetchWorkspaces();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchWorkspaces]);

  return { workspaces, error, refresh: fetchWorkspaces };
}
