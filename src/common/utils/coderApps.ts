import type { CoderApp, CoderTemplateConfig } from "@/common/orpc/schemas/coder";

/**
 * Filter apps to only those the user wants visible in the sidebar.
 * When `visibleAppSlugs` is undefined or empty, show all apps (they were
 * already filtered to non-hidden in the backend).
 */
export function filterVisibleApps(apps: CoderApp[], config?: CoderTemplateConfig): CoderApp[] {
  if (!config?.visibleAppSlugs || config.visibleAppSlugs.length === 0) {
    return apps;
  }
  const allowed = new Set(config.visibleAppSlugs);
  return apps.filter((app) => allowed.has(app.slug));
}

/**
 * Build the URL to open a Coder app in the browser.
 * External apps already have absolute URLs; internal apps use Coder's
 * subdomain-based proxy: `https://{slug}--{workspace}--{username}.{appHost}/`.
 */
export function resolveCoderAppUrl(
  appHost: string,
  username: string,
  workspaceName: string,
  app: CoderApp,
): string {
  if (app.external) {
    return app.url;
  }
  return `https://${app.slug}--${workspaceName}--${username}.${appHost}/`;
}

/**
 * Resolve a Coder app icon path to an absolute URL.
 * Icon paths from the CLI are relative (e.g. "/emojis/1f510.png").
 */
export function resolveCoderAppIcon(coderUrl: string, iconPath: string): string {
  if (!iconPath) return "";
  if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) {
    return iconPath;
  }
  // Strip trailing slash from coderUrl, icon paths start with /
  const base = coderUrl.replace(/\/$/, "");
  return `${base}${iconPath}`;
}
