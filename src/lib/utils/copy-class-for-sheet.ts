export type SheetScanInput = {
  member: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY";
};

export type MethodSheetMapping =
  | { kind: "dropin" }
  | { kind: "label"; label: string };

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

export function buildClassSheetClipboardText(input: {
  classPrice?: string;
  scans: SheetScanInput[];
}): string {
  const price = input.classPrice?.trim() || "450";
  const eligible = input.scans.filter(
    (scan) => scan.status === "SUCCESS" || scan.status === "FAILED"
  );

  return eligible
    .map((scan, index) => {
      const n = String(index + 1);
      const name = scan.member || "";
      const mapped = mapMethodToSheetLabel(scan.method);

      if (mapped.kind === "dropin") {
        return `${n}\t${name}\t\t${price}\tApp\tDrop in`;
      }
      return `${n}\t${name}\t${mapped.label}`;
    })
    .join("\n");
}
