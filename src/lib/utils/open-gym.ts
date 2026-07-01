import { Package } from "@/components/ui/packages/columns";
import { formatExpiryPeriodLabel } from "./open-gym-duration";

export const OPEN_GYM_PACKAGE_CATEGORIES = [
  "OPEN_GYM",
  "SPACE_MEMBERSHIP",
  "ULTIMATE_MINDSPACER",
] as const;

export function isOpenGymPackage(category: string): boolean {
  return OPEN_GYM_PACKAGE_CATEGORIES.includes(
    category as (typeof OPEN_GYM_PACKAGE_CATEGORIES)[number]
  );
}

export function isUnlimitedSessions(sessions: string | number): boolean {
  return Number(sessions) >= 1000;
}

export function formatRenewalLabel(
  pkg: Pick<Package, "expiryPeriod"> & Partial<Pick<Package, "name">>
): string {
  return formatExpiryPeriodLabel(pkg.expiryPeriod);
}

export function formatCatalogPackageLabel(pkg: Package): string {
  if (pkg.category === "OPEN_GYM") {
    const duration = formatRenewalLabel(pkg);
    const classIds = pkg.opensClasses?.filter(Boolean) ?? [];
    const sessions = Number(pkg.numberOfSessions);
    const hasClassBundle =
      classIds.length > 0 && Number.isFinite(sessions) && sessions < 1000;
    if (hasClassBundle) {
      return `${pkg.name}: ${duration} open gym + ${sessions} class sessions • EGP${pkg.price}`;
    }
    return `${pkg.name}: ${duration} open gym access • EGP${pkg.price}`;
  }
  if (isOpenGymPackage(pkg.category)) {
    return `${pkg.name}: ${formatRenewalLabel(pkg)} access • EGP${pkg.price}`;
  }
  if (isUnlimitedSessions(pkg.numberOfSessions)) {
    return `${pkg.name}: Unlimited sessions • EGP${pkg.price}`;
  }
  return `${pkg.name}: ${pkg.numberOfSessions} sessions • EGP${pkg.price}`;
}

export function sortPackagesWithOpenGymFirst(packages: Package[]): Package[] {
  return [...packages].sort((a, b) => {
    const aOpen = isOpenGymPackage(a.category);
    const bOpen = isOpenGymPackage(b.category);
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function getPackageEndDateFromStart(
  startDate: string,
  pkg: Pick<Package, "expiryPeriod">
): string {
  const end = new Date(startDate);
  end.setDate(end.getDate() + Number(pkg.expiryPeriod));
  return end.toISOString();
}

export function resolveOpenGymPaymentPurpose(record: {
  purpose?: string;
  note?: string;
  pkgId?: Pick<Package, "category" | "name" | "expiryPeriod">;
}): string | null {
  if (
    record.purpose === "DROPIN" &&
    record.note?.toLowerCase().includes("open gym")
  ) {
    return "Open Gym Drop-in";
  }

  if (record.purpose === "PACKAGE" && record.pkgId?.category === "OPEN_GYM") {
    if (record.pkgId.name?.trim()) {
      return record.pkgId.name;
    }
    const duration = formatRenewalLabel(record.pkgId);
    return `Open Gym ${duration} package`;
  }

  if (record.note?.toLowerCase().includes("open gym")) {
    return record.note;
  }

  return null;
}
