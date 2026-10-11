"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ArrowRightLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMembers } from "@/lib/data/member";
import { getScheduledClasses } from "@/lib/data/schedule";
import { getPackages } from "@/lib/data/package";
import { moveScanToClass } from "@/lib/data/scan-rows";
import { packageOpensClass } from "@/lib/utils/package-eligibility";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import type { MemberPackage } from "@/components/ui/members/columns";
import type { ClassScan } from "@/components/ui/scans/class-container";
import type { ScheduledClass } from "@/components/ui/schedule/columns";
import type { Package } from "@/components/ui/packages/columns";

export function MoveScanClassDialog({
  scan,
  onMoved,
  availableClasses,
}: {
  scan: ClassScan;
  onMoved?: () => void;
  availableClasses?: ScheduledClass[];
}) {
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [targetScid, setTargetScid] = useState("");
  const [pkgId, setPkgId] = useState("");
  const [memberPackages, setMemberPackages] = useState<MemberPackage[]>([]);
  const [catalogPackages, setCatalogPackages] = useState<Package[]>([]);

  useEffect(() => {
    if (!open) {
      setTargetScid("");
      setPkgId("");
      return;
    }

    let isCancelled = false;

    const loadData = async () => {
      try {
        setLoadingClasses(true);

        const promises: Promise<any>[] = [
          getPackages(),
          availableClasses && availableClasses.length > 0
            ? Promise.resolve(availableClasses)
            : getScheduledClasses(undefined, scan.time),
        ];

        if (scan.memberId) {
          promises.push(getMembers("", 1, 1, scan.memberId));
        }

        const [pkgsRes, classListRes, memberRes] = await Promise.all(promises);

        if (!isCancelled) {
          if (Array.isArray(pkgsRes)) {
            setCatalogPackages(pkgsRes);
          }
          if (Array.isArray(classListRes)) {
            setClasses(
              classListRes.filter(
                (c) => c._id && c._id.toString() !== scan.parentId,
              ),
            );
          }
          if (memberRes?.data && memberRes.data.length > 0) {
            const member = memberRes.data[0];
            const activePkgs =
              member.packages?.filter((p: MemberPackage) => p.status !== "DELETED") ?? [];
            setMemberPackages(activePkgs);
          }
        }
      } catch (err) {
        console.error("Failed to load classes or member packages", err);
      } finally {
        if (!isCancelled) setLoadingClasses(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [open, availableClasses, scan.parentId, scan.time, scan.memberId]);

  const selectedClass = classes.find((c) => c._id === targetScid);
  const isAlreadyBookedInTarget =
    Boolean(scan.memberId) &&
    Boolean(
      selectedClass?.bookedMembers?.some(
        (b: any) =>
          (b.uid?.toString() || b._id?.toString() || b.id) === scan.memberId,
      ),
    );

  const eligiblePackages: MemberPackage[] = useMemo(() => {
    if (!memberPackages.length) return [];
    let pool = memberPackages.filter((p) => p.status !== "DELETED");

    if (selectedClass?.cid && catalogPackages.length > 0) {
      const validCatalogIds = new Set(
        catalogPackages
          .filter((cp) => packageOpensClass(cp, selectedClass.cid))
          .map((cp) => cp._id)
      );
      pool = pool.filter((p: MemberPackage) => validCatalogIds.has(p._id));
    }

    // Deduplicate by catalog pkgId (p._id), picking the best holding (ACTIVE with remainingClasses > 0)
    const byId = new Map<string, MemberPackage>();
    for (const pkg of pool) {
      const existing = byId.get(pkg._id);
      if (!existing) {
        byId.set(pkg._id, pkg);
        continue;
      }
      const isPkgActive = pkg.status === "ACTIVE" && pkg.remainingClasses > 0;
      const isExistingActive = existing.status === "ACTIVE" && existing.remainingClasses > 0;
      if (isPkgActive && !isExistingActive) {
        byId.set(pkg._id, pkg);
      } else if (isPkgActive && isExistingActive && pkg.remainingClasses > existing.remainingClasses) {
        byId.set(pkg._id, pkg);
      }
    }

    return Array.from(byId.values());
  }, [memberPackages, selectedClass, catalogPackages]);

  useEffect(() => {
    if (!targetScid) return;
    if (isAlreadyBookedInTarget) return;

    const isCurrentValid = eligiblePackages.some((p: MemberPackage) => p._id === pkgId);
    if (!isCurrentValid) {
      const candidate =
        eligiblePackages.find((p: MemberPackage) => p.status === "ACTIVE" && p.remainingClasses > 0) ||
        eligiblePackages[0];
      setPkgId(candidate?._id ?? "");
    }
  }, [eligiblePackages, targetScid, isAlreadyBookedInTarget, pkgId]);

  const handleMove = async () => {
    if (!scan.source || !scan.parentId || !scan.rowId) {
      toast.error("This check-in cannot be moved");
      return;
    }

    if (!targetScid) {
      toast.error("Please select the target class");
      return;
    }

    if (!isAlreadyBookedInTarget && eligiblePackages.length > 0 && !pkgId) {
      toast.error("Please select which package to charge");
      return;
    }

    if (!isAlreadyBookedInTarget && eligiblePackages.length === 0) {
      toast.error("No eligible packages found for this class");
      return;
    }

    try {
      setMoving(true);
      await moveScanToClass(
        { source: scan.source, parentId: scan.parentId, rowId: scan.rowId },
        targetScid,
        { pkgId: isAlreadyBookedInTarget ? undefined : pkgId || undefined },
      );
      toast.success("Check-in moved to new class");
      setOpen(false);
      onMoved?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label="Move check-in to another class"
          title="Move to another class (false QR code)"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] w-full">
        <DialogHeader>
          <DialogTitle>Move check-in to another class</DialogTitle>
          <DialogDescription>
            Correct a false QR code scan. Moving this check-in to the correct class
            returns the session from the current class and books/charges the target class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Member & current scan summary */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{scan.member}</p>
              <span className="text-xs text-muted-foreground">
                {scan.phone || "No phone"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current class: <span className="font-medium text-foreground">{scan.method}</span> ·{" "}
              {format(new Date(scan.time), "hh:mm a")}
            </p>
          </div>

          {/* Target class selection */}
          <div className="space-y-1.5">
            <Label htmlFor="target-class">Target class to move scan to</Label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading classes for this day...
              </div>
            ) : classes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">
                No other scheduled classes found on this day.
              </p>
            ) : (
              <Select value={targetScid} onValueChange={setTargetScid}>
                <SelectTrigger id="target-class" className="w-full">
                  <SelectValue placeholder="Select the class attended" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
                  {classes.map((cls) => {
                    const timeStr = cls.startTime
                      ? format(new Date(cls.startTime), "hh:mm a")
                      : "";
                    const name = cls.className || "Class";
                    const coach = cls.coachName ? ` (${cls.coachName})` : "";
                    return (
                      <SelectItem key={cls._id} value={cls._id!}>
                        <span className="truncate">
                          {name} — {timeStr}
                          {coach}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Booking / Package feedback */}
          {targetScid && isAlreadyBookedInTarget ? (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span>
                {scan.member} is already booked in this class. Attendance will be recorded using their existing booking with no extra session charged.
              </span>
            </div>
          ) : targetScid ? (
            eligiblePackages.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                No packages available for this class in {scan.member}&apos;s account.
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Package to charge for new class</Label>
                <Select value={pkgId} onValueChange={setPkgId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
                    {eligiblePackages.map((p: MemberPackage) => (
                      <SelectItem key={p._id} value={p._id}>
                        <span className="truncate">
                          {p.name} — {p.remainingClasses} left{p.status !== "ACTIVE" ? ` (${p.status})` : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  1 session will be returned from the previous class and 1 session will be charged on this package.
                </p>
              </div>
            )
          ) : null}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={moving || !targetScid || loadingClasses}
          >
            {moving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              "Move check-in"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
