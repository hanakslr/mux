import { useCallback, useEffect, useRef, useState } from "react";

import { useAPI } from "@/browser/contexts/API";
import type { CoderApp } from "@/common/orpc/schemas/coder";

/** Polling interval for template apps (60 seconds — apps change rarely). */
const POLL_INTERVAL_MS = 60_000;

/**
 * Fetches all Coder workspaces and groups their apps by template name.
 * Returns a `Map<templateName, CoderApp[]>` with deduplicated apps per template.
 *
 * Also returns the Coder deployment URL needed to resolve relative icon paths.
 */
export function useCoderTemplateApps(): {
  appsByTemplate: Map<string, CoderApp[]>;
  coderUrl: string;
} {
  const { api } = useAPI();
  const [appsByTemplate, setAppsByTemplate] = useState<Map<string, CoderApp[]>>(new Map());
  const [coderUrl, setCoderUrl] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchApps = useCallback(async () => {
    if (!api?.coder?.listWorkspaces) return;

    try {
      // Fetch Coder URL for icon resolution
      if (!coderUrl && api.coder.getInfo) {
        const info = await api.coder.getInfo();
        if (info.state === "available" && info.url) {
          setCoderUrl(info.url);
        }
      }

      const result = await api.coder.listWorkspaces();
      if (!result.ok) return;

      // Group apps by template, deduplicate by slug within each template
      const grouped = new Map<string, CoderApp[]>();
      for (const ws of result.workspaces) {
        if (ws.apps.length === 0) continue;
        const existing = grouped.get(ws.templateName);
        if (!existing) {
          grouped.set(ws.templateName, [...ws.apps]);
        } else {
          // Merge apps not already seen for this template
          const slugs = new Set(existing.map((a) => a.slug));
          for (const app of ws.apps) {
            if (!slugs.has(app.slug)) {
              existing.push(app);
              slugs.add(app.slug);
            }
          }
        }
      }
      setAppsByTemplate(grouped);
    } catch {
      // Best-effort — don't break the sidebar
    }
  }, [api, coderUrl]);

  useEffect(() => {
    void fetchApps();

    intervalRef.current = setInterval(() => {
      void fetchApps();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchApps]);

  return { appsByTemplate, coderUrl };
}
