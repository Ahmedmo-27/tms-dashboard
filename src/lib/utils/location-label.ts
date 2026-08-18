export type LocationRef =
  | string
  | { branchName?: string; location?: string; _id?: string }
  | null
  | undefined;

export function getBranchLabel(ref: LocationRef): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return null;
  return ref.branchName ?? ref.location ?? null;
}

/** Packages without a location are available at all branches. */
export function getPackageBranchLabel(
  locationId: LocationRef,
  branchLabel?: string | null
): string | null {
  if (branchLabel) return branchLabel;
  const label = getBranchLabel(locationId);
  if (label) return label;
  if (!locationId) return "All";
  return null;
}
