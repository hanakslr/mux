import { useCallback, useEffect, useState } from "react";
import { Settings2 } from "lucide-react";

import { useAPI } from "@/browser/contexts/API";
import { useCoderTemplateApps } from "@/browser/hooks/useCoderTemplateApps";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/browser/components/SelectPrimitive/SelectPrimitive";
import { resolveCoderAppIcon } from "@/common/utils/coderApps";
import type { CoderTemplate } from "@/common/orpc/schemas/coder";
import type { CoderTemplateConfig } from "@/common/orpc/schemas/coder";

/**
 * Settings subsection for per-template Coder configuration.
 * Shows a template dropdown, repo path input, and app visibility checkboxes.
 */
export function CoderTemplateConfigSection(props: { templates: CoderTemplate[] }) {
  const { api } = useAPI();
  const { appsByTemplate, coderUrl } = useCoderTemplateApps();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateConfigs, setTemplateConfigs] = useState<Record<string, CoderTemplateConfig>>({});
  const [repoPath, setRepoPath] = useState("");

  // Load template configs from backend
  useEffect(() => {
    if (!api?.config?.getConfig) return;
    void api.config.getConfig().then((cfg) => {
      setTemplateConfigs(cfg.coderTemplateConfigs ?? {});
    });
  }, [api]);

  // Auto-select first template
  useEffect(() => {
    if (!selectedTemplate && props.templates.length > 0) {
      setSelectedTemplate(props.templates[0].name);
    }
  }, [selectedTemplate, props.templates]);

  // Sync local state when selected template changes
  useEffect(() => {
    if (!selectedTemplate) return;
    const config = templateConfigs[selectedTemplate];
    setRepoPath(config?.remoteProjectPath ?? "");
  }, [selectedTemplate, templateConfigs]);

  const currentConfig = selectedTemplate ? templateConfigs[selectedTemplate] : undefined;
  const apps = selectedTemplate ? (appsByTemplate.get(selectedTemplate) ?? []) : [];

  // Determine which app slugs are visible. When visibleAppSlugs is undefined,
  // all apps are visible (default behavior).
  const visibleSlugs = currentConfig?.visibleAppSlugs;
  const isAppVisible = (slug: string): boolean => {
    if (!visibleSlugs) return true; // default: all visible
    return visibleSlugs.includes(slug);
  };

  const saveConfig = useCallback(
    (config: CoderTemplateConfig) => {
      if (!api?.config?.updateCoderTemplateConfig || !selectedTemplate) return;
      const updated = { ...templateConfigs, [selectedTemplate]: config };
      setTemplateConfigs(updated);
      void api.config
        .updateCoderTemplateConfig({
          templateName: selectedTemplate,
          config,
        })
        .catch((err) => {
          console.warn("Failed to save Coder template config", err);
        });
    },
    [api, selectedTemplate, templateConfigs]
  );

  const handleRepoPathBlur = useCallback(() => {
    const trimmed = repoPath.trim();
    saveConfig({
      ...currentConfig,
      remoteProjectPath: trimmed || undefined,
    });
  }, [repoPath, currentConfig, saveConfig]);

  const handleAppToggle = useCallback(
    (slug: string, visible: boolean) => {
      // Build the new visible slugs list
      let newSlugs: string[];
      if (!visibleSlugs) {
        // Was "all visible" — switching to explicit list: include all except the toggled-off one
        newSlugs = visible
          ? apps.map((a) => a.slug)
          : apps.filter((a) => a.slug !== slug).map((a) => a.slug);
      } else {
        newSlugs = visible ? [...visibleSlugs, slug] : visibleSlugs.filter((s) => s !== slug);
      }

      // If all apps are now visible, clear the list (back to default)
      const allVisible = apps.every((a) => newSlugs.includes(a.slug));
      saveConfig({
        ...currentConfig,
        visibleAppSlugs: allVisible ? undefined : newSlugs,
      });
    },
    [visibleSlugs, apps, currentConfig, saveConfig]
  );

  if (props.templates.length === 0) return null;

  return (
    <div className="border-border-medium mt-6 space-y-4 border-t pt-6">
      <div className="flex items-center gap-2">
        <Settings2 size={14} className="text-muted" />
        <h3 className="text-foreground text-sm font-medium">Coder Template Defaults</h3>
      </div>

      <div className="space-y-3">
        {/* Template selector */}
        <div className="flex items-center gap-3">
          <label className="text-muted shrink-0 text-xs">Template</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="h-7 flex-1 text-xs">
              <SelectValue placeholder="Select a template…" />
            </SelectTrigger>
            <SelectContent>
              {props.templates.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.displayName || t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && (
          <>
            {/* Default repo path */}
            <div className="flex items-center gap-3">
              <label className="text-muted shrink-0 text-xs">Repo path</label>
              <input
                type="text"
                placeholder="/home/coder/project"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                onBlur={handleRepoPathBlur}
                className="bg-background text-foreground placeholder:text-muted border-border-medium focus:border-accent h-7 flex-1 rounded border px-2 text-xs focus:outline-none"
              />
            </div>

            {/* App visibility checkboxes */}
            {apps.length > 0 && (
              <div>
                <label className="text-muted mb-1.5 block text-xs">Visible apps in sidebar</label>
                <div className="flex flex-wrap gap-2">
                  {apps.map((app) => {
                    const iconUrl = resolveCoderAppIcon(coderUrl, app.icon);
                    return (
                      <label
                        key={app.slug}
                        className="bg-hover hover:bg-sidebar-active flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isAppVisible(app.slug)}
                          onChange={(e) => handleAppToggle(app.slug, e.target.checked)}
                          className="accent-accent h-3 w-3"
                        />
                        {iconUrl && (
                          <img src={iconUrl} alt="" className="h-3.5 w-3.5" loading="lazy" />
                        )}
                        <span className="text-foreground">{app.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
