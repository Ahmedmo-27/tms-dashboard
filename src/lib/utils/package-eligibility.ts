import type { Package } from "@/components/ui/packages/columns";

/**
 * Checks whether a catalog package opens a scheduled class by its class definition id (cid).
 * If classCid is not provided, returns true.
 */
export function packageOpensClass(
  pkg: { opensClasses?: any[] } | Package,
  classCid?: string,
): boolean {
  if (!classCid) return true;
  if (
    !pkg.opensClasses ||
    !Array.isArray(pkg.opensClasses) ||
    pkg.opensClasses.length === 0
  ) {
    return false;
  }
  return pkg.opensClasses.some((c: any) => {
    const id = typeof c === "string" ? c : c?._id?.toString() || c?.id;
    return id === classCid;
  });
}
