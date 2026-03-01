import { useCoderTemplateApps } from "@/browser/hooks/useCoderTemplateApps";
import { CoderAppIcons } from "@/browser/components/CoderAppIcons/CoderAppIcons";
import type { FrontendWorkspaceMetadata } from "@/common/types/workspace";

/**
 * Renders Coder app icons for a Mux-managed Coder workspace.
 * Subscribes directly to the template apps hook (colocated subscription)
 * so the parent WorkspaceListItem doesn't need to know about Coder apps.
 */
export function CoderWorkspaceApps(props: { metadata: FrontendWorkspaceMetadata }) {
  const runtimeConfig = props.metadata.runtimeConfig;
  if (runtimeConfig?.type !== "ssh" || !runtimeConfig.coder?.template) {
    return null;
  }

  const templateName = runtimeConfig.coder.template;
  const workspaceName = runtimeConfig.coder.workspaceName;
  return <CoderWorkspaceAppsInner templateName={templateName} workspaceName={workspaceName} />;
}

/** Inner component that calls hooks unconditionally (no early returns before hooks). */
function CoderWorkspaceAppsInner(props: { templateName: string; workspaceName?: string }) {
  const { appsByTemplate } = useCoderTemplateApps();
  const apps = appsByTemplate.get(props.templateName);

  if (!apps || apps.length === 0) return null;

  return (
    <CoderAppIcons
      apps={apps}
      templateName={props.templateName}
      workspaceName={props.workspaceName}
    />
  );
}
