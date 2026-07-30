"use client";

import { Button } from "@/components/ui/button";
import type { ClassScan } from "@/components/ui/scans/class-container";
import { toast } from "react-hot-toast";

type CopyAttendanceForSheetButtonProps = {
  scans: ClassScan[];
  buildText: (scans: ClassScan[]) => string;
  label?: string;
  successMessage?: string;
};

export function CopyAttendanceForSheetButton({
  scans,
  buildText,
  label = "Copy for Sheet",
  successMessage = "Attendance copied for sheet",
}: CopyAttendanceForSheetButtonProps) {
  const sheetEligibleCount = scans.filter(
    (scan) => scan.status === "SUCCESS" || scan.status === "FAILED"
  ).length;

  const handleCopy = async () => {
    if (sheetEligibleCount === 0) {
      toast.error("No successful or failed check-ins to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(buildText(scans));
      toast.success(successMessage);
    } catch {
      toast.error("Failed to copy attendance");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={sheetEligibleCount === 0}
    >
      {label}
    </Button>
  );
}
