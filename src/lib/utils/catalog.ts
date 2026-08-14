export function deriveUniqueCategories(items: { category: string }[]): string[] {
  return [...new Set(items.map((i) => i.category))].sort();
}

export function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "FUNCTIONAL_TRAINING":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "STUDIO":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "SWIMMING":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "PERSONAL_TRAINING":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "OPEN_GYM":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export function formatSessionCount(sessions: string): string {
  return sessions === "1000" ? "Unlimited" : sessions;
}
