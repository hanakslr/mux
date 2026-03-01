import { useEffect, useState } from "react";

import { useAPI } from "@/browser/contexts/API";
import type { CoderApp, CoderTemplateConfig } from "@/common/orpc/schemas/coder";
import { filterVisibleApps, resolveCoderAppIcon, resolveCoderAppUrl } from "@/common/utils/coderApps";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/browser/components/Tooltip/Tooltip";

interface CoderAppIconsProps {
  apps: CoderApp[];
  templateName: string;
  /** Workspace name — required to construct proxy URLs for internal apps. */
  workspaceName?: string;
}

/**
 * Renders a row of small app icons for a Coder workspace.
 * Fetches template config and Coder URL internally (colocated subscription).
 * When `workspaceName` is provided, icons are clickable and open the app.
 */
export function CoderAppIcons(props: CoderAppIconsProps) {
  const { api } = useAPI();
  const [coderUrl, setCoderUrl] = useState("");
  const [coderUsername, setCoderUsername] = useState("");
  const [coderAppHost, setCoderAppHost] = useState("");
  const [templateConfig, setTemplateConfig] = useState<CoderTemplateConfig | undefined>();

  // Fetch Coder URL + username + app hostname + template configs once
  useEffect(() => {
    if (!api?.coder?.getInfo) return;
    void api.coder.getInfo().then((info) => {
      if (info.state === "available") {
        if (info.url) setCoderUrl(info.url);
        if (info.username) setCoderUsername(info.username);
        if (info.appHost) setCoderAppHost(info.appHost);
      }
    });
  }, [api]);

  useEffect(() => {
    if (!api?.config?.getConfig) return;
    void api.config.getConfig().then((cfg) => {
      setTemplateConfig(cfg.coderTemplateConfigs?.[props.templateName]);
    });
  }, [api, props.templateName]);

  const visibleApps = filterVisibleApps(props.apps, templateConfig);
  if (visibleApps.length === 0 || !coderUrl) return null;

  // Need workspace name, username, and app hostname to construct clickable URLs
  const canOpen = !!props.workspaceName && !!coderUsername && !!coderAppHost;

  return (
    <div className="flex items-center gap-0.5">
      {visibleApps.map((app) => {
        const iconUrl = resolveCoderAppIcon(coderUrl, app.icon);
        if (!iconUrl) return null;
        return (
          <Tooltip key={app.slug}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0"
                onClick={
                  canOpen
                    ? (e) => {
                        e.stopPropagation();
                        const url = resolveCoderAppUrl(coderAppHost, coderUsername, props.workspaceName!, app);
                        window.open(url, "_blank", "noopener");
                      }
                    : undefined
                }
              >
                <img
                  src={iconUrl}
                  alt={app.displayName}
                  className="h-3 w-3 opacity-60 hover:opacity-100"
                  loading="lazy"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {app.displayName}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
