/**
 * Returns the default duration in minutes for a given class title.
 * Reformer classes default to 50 minutes; all other classes default to 60 minutes (1 hour).
 */
export function getDefaultClassDurationMinutes(classTitle?: string | null): number {
  if (!classTitle) return 60;
  return /reformer/i.test(classTitle) ? 50 : 60;
}

export function getDefaultClassDurationMs(classTitle?: string | null): number {
  return getDefaultClassDurationMinutes(classTitle) * 60 * 1000;
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
