import { Monitor } from "lucide-react";

import { cn } from "@/common/lib/utils";
import type { ExternalCoderWorkspace } from "@/common/orpc/schemas/coder";
import type { CoderWorkspaceStatus } from "@/common/orpc/schemas/coder";

/** Map coder workspace status to a dot color for the sidebar indicator. */
function statusDotColor(status: CoderWorkspaceStatus): string {
  switch (status) {
    case "running":
      return "bg-green-500";
    case "starting":
      return "bg-yellow-500 animate-pulse";
    case "stopping":
    case "canceling":
    case "deleting":
      return "bg-yellow-500";
    case "stopped":
    case "canceled":
    case "deleted":
      return "bg-neutral-400";
    case "failed":
      return "bg-red-500";
    case "pending":
      return "bg-yellow-500 animate-pulse";
  }
}

interface ExternalCoderWorkspaceItemProps {
  workspace: ExternalCoderWorkspace;
  onOpenInMux: (workspaceName: string) => void;
}

/**
 * Renders an external (non-Mux-managed) Coder workspace in the sidebar.
 * Visually subdued compared to first-class Mux workspaces.
 */
export function ExternalCoderWorkspaceItem(props: ExternalCoderWorkspaceItemProps) {
  return (
    <button
      className={cn(
        "group flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors duration-100",
        "hover:bg-hover cursor-pointer border-none bg-transparent",
        "text-muted text-xs"
      )}
      onClick={() => props.onOpenInMux(props.workspace.name)}
      title={`Open "${props.workspace.name}" in Mux (template: ${props.workspace.templateDisplayName})`}
    >
      <Monitor size={12} className="text-muted shrink-0 opacity-60" />
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotColor(props.workspace.status))}
      />
      <span className="min-w-0 flex-1 truncate">{props.workspace.name}</span>
      <span className="text-muted truncate text-[10px] opacity-50">
        {props.workspace.templateDisplayName}
      </span>
    </button>
  );
}
