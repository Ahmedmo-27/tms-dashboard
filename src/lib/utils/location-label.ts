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
