/**
 * Returns the default duration in minutes for a given class or class title.
 * If defaultDuration is set on the class, returns it.
 * Otherwise Reformer classes default to 50 minutes; all other classes default to 60 minutes (1 hour).
 */
export function getDefaultClassDurationMinutes(
  classOrTitle?: { title?: string; defaultDuration?: number | null } | string | null
): number {
  if (!classOrTitle) return 60;
  if (typeof classOrTitle === "object") {
    if (typeof classOrTitle.defaultDuration === "number" && classOrTitle.defaultDuration > 0) {
      return classOrTitle.defaultDuration;
    }
    const title = classOrTitle.title || "";
    return /reformer/i.test(title) ? 50 : 60;
  }
  return /reformer/i.test(classOrTitle) ? 50 : 60;
}

export function getDefaultClassDurationMs(
  classOrTitle?: { title?: string; defaultDuration?: number | null } | string | null
): number {
  return getDefaultClassDurationMinutes(classOrTitle) * 60 * 1000;
}

export function formatDurationLabel(durationMinutes: number): string {
  if (durationMinutes === 50) return "50 Mins";
  if (durationMinutes === 60) return "1 Hour";
  return `${durationMinutes} Mins`;
}

export function formatDurationBadge(durationMinutes: number): string {
  if (durationMinutes === 50) return "50 min default";
  if (durationMinutes === 60) return "1 hr default";
  return `${durationMinutes}m`;
}
