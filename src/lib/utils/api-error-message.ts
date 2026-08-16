import { ApiError } from "@/core/api-error";

type AffectedMember = {
  name?: string;
  status?: string;
};

type PackageDeleteImpact = {
  activeSubscriptions?: number;
  deletedOrCompletedSubscriptions?: number;
  paymentCount?: number;
  affectedMembers?: AffectedMember[];
  warningMessage?: string;
};

function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function formatPackageSubscriberConflict(
  impact: PackageDeleteImpact,
): string | null {
  const activeCount = impact.activeSubscriptions ?? 0;
  const inactiveCount = impact.deletedOrCompletedSubscriptions ?? 0;
  const paymentCount = impact.paymentCount ?? 0;
  const members = impact.affectedMembers ?? [];

  const activeNames = [
    ...new Set(
      members
        .filter((m) => (m.status ?? "").toUpperCase() === "ACTIVE" && m.name)
        .map((m) => m.name!.trim())
        .filter(Boolean),
    ),
  ];

  const parts: string[] = [];

  if (activeCount > 0) {
    const memberLabel = activeCount === 1 ? "active member" : "active members";
    const who =
      activeNames.length > 0 ? `: ${joinNames(activeNames)}` : "";
    parts.push(
      `This package cannot be deleted because it has ${activeCount} ${memberLabel}${who}.`,
    );
  } else if (inactiveCount > 0 || paymentCount > 0) {
    parts.push(
      "This package cannot be deleted because related subscriptions or payments still reference it.",
    );
  } else {
    return null;
  }

  const orphanBits: string[] = [];
  if (inactiveCount > 0) {
    orphanBits.push(
      `${inactiveCount} inactive subscription${inactiveCount === 1 ? "" : "s"}`,
    );
  }
  if (paymentCount > 0) {
    orphanBits.push(
      `${paymentCount} payment record${paymentCount === 1 ? "" : "s"}`,
    );
  }
  if (orphanBits.length > 0) {
    parts.push(
      `Deleting it would also orphan ${joinNames(orphanBits)}. Members may see dashboard errors until subscriptions are repaired.`,
    );
  } else {
    parts.push(
      "Members may see dashboard errors until subscriptions are repaired.",
    );
  }

  return parts.join(" ");
}

/**
 * Prefer structured conflict impact when present; otherwise use the API message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const context = error.context as {
      code?: string;
      impact?: PackageDeleteImpact;
      message?: string;
      context?: { impact?: PackageDeleteImpact; code?: string };
    };

    const impact = context.impact ?? context.context?.impact;
    const code =
      context.code ??
      context.context?.code ??
      (typeof error.message === "string" &&
      error.message.startsWith("PACKAGE_HAS_ACTIVE_SUBSCRIBERS")
        ? "PACKAGE_HAS_ACTIVE_SUBSCRIBERS"
        : undefined);

    const looksLikePackageSubscriberConflict =
      code === "PACKAGE_HAS_ACTIVE_SUBSCRIBERS" ||
      Boolean(impact?.activeSubscriptions) ||
      Boolean(impact?.affectedMembers?.length) ||
      Boolean(impact?.warningMessage);

    if (looksLikePackageSubscriberConflict && impact) {
      const formatted = formatPackageSubscriberConflict(impact);
      if (formatted) return formatted;
      if (impact.warningMessage) return impact.warningMessage;
    }

    return error.message || context.message || "An error occurred";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "An error occurred";
}
