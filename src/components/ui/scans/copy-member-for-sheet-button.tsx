"use client";

import { Button } from "@/components/ui/button";
import type { ClassScan } from "@/components/ui/scans/class-container";
import {
  buildMemberSheetClipboardText,
  type MethodSheetMapping,
  type SheetScanInput,
} from "@/lib/utils/copy-class-for-sheet";
import { toast } from "react-hot-toast";

type CopyMemberForSheetButtonProps = {
  scan: ClassScan;
  mapMethod: (method: string) => MethodSheetMapping;
  classPrice?: string;
};

export function CopyMemberForSheetButton({
  scan,
  mapMethod,
  classPrice,
}: CopyMemberForSheetButtonProps) {
  const sheetRow = buildMemberSheetClipboardText(
    scan as SheetScanInput,
    mapMethod,
    classPrice
  );
  const canCopy = sheetRow !== null;

  const handleCopy = async () => {
    if (!sheetRow) {
      toast.error("This check-in cannot be copied for the sheet");
      return;
    }

    try {
      await navigator.clipboard.writeText(sheetRow);
      toast.success("Member copied for sheet");
    } catch {
      toast.error("Failed to copy member");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={!canCopy}
      className="whitespace-nowrap text-xs"
    >
      Copy member for sheet
    </Button>
  );
}
