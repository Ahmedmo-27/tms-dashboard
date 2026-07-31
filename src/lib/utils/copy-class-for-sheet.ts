export type SheetScanInput = {
  member: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY";
};

export type MethodSheetMapping =
  | { kind: "dropin" }
  | { kind: "label"; label: string };

function extractAfterWith(method: string): string {
  const match = method.match(/\bwith\s+(.+)$/i);
  return match?.[1]?.trim() || "Coach";
}

/** Class attendance package → sheet label */
export function mapMethodToSheetLabel(method: string): MethodSheetMapping {
  const normalized = (method || "").trim().toLowerCase();

  if (normalized === "drop in" || normalized === "drop-in") {
    return { kind: "dropin" };
  }
  if (normalized.includes("spacer mix")) {
    return { kind: "label", label: "Spacer mix member" };
  }
  if (normalized.includes("ultimate mindspacer")) {
    return { kind: "label", label: "UMS App member" };
  }
  if (normalized.includes("functional training")) {
    return { kind: "label", label: "Ft App member" };
  }
  if (
    normalized.includes("prenatal") ||
    normalized.includes("postpartum") ||
    normalized.includes("pre/post")
  ) {
    return { kind: "label", label: "Pre/Post App member" };
  }
  if (normalized.includes("studio")) {
    return { kind: "label", label: "ST App member" };
  }

  return { kind: "label", label: method?.trim() || "" };
}

/**
 * PT attendance package → sheet label.
 * e.g. "10 Personal Training with Salma" → "PT with Salma"
 * e.g. "8 pre/post pt with Ahmed" → "Pre/Post PT with Ahmed"
 */
export function mapPtMethodToSheetLabel(method: string): MethodSheetMapping {
  const normalized = (method || "").trim().toLowerCase();

  if (normalized === "drop in" || normalized === "drop-in") {
    return { kind: "dropin" };
  }

  const isPrePost =
    normalized.includes("pre/post") ||
    normalized.includes("pre-post") ||
    normalized.includes("prenatal") ||
    normalized.includes("postpartum");
  const isPt =
    normalized.includes("personal training") ||
    /(^|\s)pt(\s|$)/.test(normalized);

  if (isPt && normalized.includes("with")) {
    const coach = extractAfterWith(method);
    if (isPrePost) {
      return { kind: "label", label: `Pre/Post PT with ${coach}` };
    }
    return { kind: "label", label: `PT with ${coach}` };
  }

  return { kind: "label", label: method?.trim() || "" };
}

/** Open Gym / Space attendance package → sheet label */
export function mapOpenGymMethodToSheetLabel(
  method: string
): MethodSheetMapping {
  const normalized = (method || "").trim().toLowerCase();

  if (normalized === "drop in" || normalized === "drop-in") {
    return { kind: "dropin" };
  }
  if (normalized.includes("spacer mix")) {
    return { kind: "label", label: "Spacer Mix App Member" };
  }
  if (normalized.includes("ultimate mindspacer")) {
    return { kind: "label", label: "UMS App member" };
  }
  if (
    normalized.includes("space membership") ||
    /^(\d+\s+(month|months)\s+)?space(\s|$)/.test(normalized)
  ) {
    return { kind: "label", label: "Space App Member" };
  }

  return { kind: "label", label: method?.trim() || "" };
}

function buildMemberSheetRow(
  scan: SheetScanInput,
  mapMethod: (method: string) => MethodSheetMapping,
  classPrice?: string
): string | null {
  if (scan.status !== "SUCCESS" && scan.status !== "FAILED") {
    return null;
  }

  const name = scan.member || "";
  const mapped = mapMethod(scan.method);
  const price = classPrice?.trim() || "450";

  if (mapped.kind === "dropin") {
    return `${name}\t\t${price}\tApp\tDrop in`;
  }
  return `${name}\t${mapped.label}`;
}

function buildRows(
  scans: SheetScanInput[],
  mapMethod: (method: string) => MethodSheetMapping,
  classPrice?: string
): string {
  const eligible = scans.filter(
    (scan) => scan.status === "SUCCESS" || scan.status === "FAILED"
  );

  return eligible
    .map((scan, index) => {
      const row = buildMemberSheetRow(scan, mapMethod, classPrice);
      if (!row) return "";
      return `${index + 1}\t${row}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildMemberSheetClipboardText(
  scan: SheetScanInput,
  mapMethod: (method: string) => MethodSheetMapping,
  classPrice?: string
): string | null {
  return buildMemberSheetRow(scan, mapMethod, classPrice);
}

export function buildClassSheetClipboardText(input: {
  classPrice?: string;
  scans: SheetScanInput[];
}): string {
  return buildRows(input.scans, mapMethodToSheetLabel, input.classPrice);
}

export function buildPtSheetClipboardText(scans: SheetScanInput[]): string {
  return buildRows(scans, mapPtMethodToSheetLabel);
}

export function buildOpenGymSheetClipboardText(
  scans: SheetScanInput[]
): string {
  return buildRows(scans, mapOpenGymMethodToSheetLabel);
}
