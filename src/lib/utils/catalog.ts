export function deriveUniqueCategories(items: { category: string }[]): string[] {
  return [...new Set(items.map((i) => i.category))].sort();
}

export function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
