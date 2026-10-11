"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, Pencil, Search, User } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { getMembers } from "@/lib/data/member";
import { getPackages } from "@/lib/data/package";
import { getScheduledClasses } from "@/lib/data/schedule";
import { updateScanRow, type ScanRowChanges } from "@/lib/data/scan-rows";
import { packageOpensClass } from "@/lib/utils/package-eligibility";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import type { Member, MemberPackage } from "@/components/ui/members/columns";
import type { ClassScan } from "@/components/ui/scans/class-container";
import type { ScheduledClass } from "@/components/ui/schedule/columns";
import type { Package } from "@/components/ui/packages/columns";

/** Datetime-local wants the wall clock, not an ISO instant. */
function toLocalInput(value: string): string {
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd'T'HH:mm");
}

export function EditScanRow({
  scan,
  onSaved,
  availableClasses,
}: {
  scan: ClassScan;
  onSaved?: () => void;
  availableClasses?: ScheduledClass[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Member
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [newMember, setNewMember] = useState<Member | null>(null);

  // Class
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [selectedScid, setSelectedScid] = useState<string>(
    scan.source === "class" && scan.parentId ? scan.parentId : "none"
  );

  // Catalog packages
  const [catalogPackages, setCatalogPackages] = useState<Package[]>([]);

  // Package
  const [pkgId, setPkgId] = useState<string>(scan.pkgId ?? "");

  // Time & Status
  const [time, setTime] = useState<string>(toLocalInput(scan.time));
  const [status, setStatus] = useState<"SUCCESS" | "FAILED" | "WILL_PAY">(
    scan.status ?? "SUCCESS",
  );

  // Guest
  const isGuestRow = Boolean(scan.isGuest || !scan.memberId);
  const [guestName, setGuestName] = useState(isGuestRow ? scan.member : "");
  const [guestPhone, setGuestPhone] = useState(isGuestRow ? scan.phone : "");

  const canEditGuest = isGuestRow && !newMember && scan.source !== "pt";

  const reset = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setNewMember(null);
    setSelectedScid(
      scan.source === "class" && scan.parentId ? scan.parentId : "none"
    );
    setPkgId(scan.pkgId ?? "");
    setTime(toLocalInput(scan.time));
    setStatus(scan.status ?? "SUCCESS");
    setGuestName(isGuestRow ? scan.member : "");
    setGuestPhone(isGuestRow ? scan.phone : "");
  }, [scan, isGuestRow]);

  // Load initial catalog packages, day's classes, and current member
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);

        const promises: Promise<any>[] = [
          getPackages(),
          availableClasses && availableClasses.length > 0
            ? Promise.resolve(availableClasses)
            : getScheduledClasses(undefined, scan.time),
        ];

        if (scan.memberId) {
          promises.push(getMembers("", 1, 1, scan.memberId));
        }

        const [pkgsRes, classesRes, memberRes] = await Promise.all(promises);

        if (!cancelled) {
          if (Array.isArray(pkgsRes)) {
            setCatalogPackages(pkgsRes);
          }
          if (Array.isArray(classesRes)) {
            setClasses(classesRes);
          }
          if (memberRes?.data && memberRes.data.length > 0) {
            setCurrentMember(memberRes.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load initial data for edit scan dialog", err);
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [open, availableClasses, scan.time, scan.memberId]);

  // Member search
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const query = debouncedSearch.trim();
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const res = await getMembers(query, 1, 10);
        if (!cancelled) setSearchResults(res.data || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const activeMember = newMember ?? currentMember;

  const handlePickMember = (member: Member) => {
    setNewMember(member);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Determine currently selected class
  const selectedClass = useMemo(() => {
    if (!selectedScid || selectedScid === "none") return null;
    return classes.find((c) => c._id === selectedScid) ?? null;
  }, [classes, selectedScid]);

  const targetCid = selectedClass?.cid;

  // Check if active member is already booked in selected class
  const isAlreadyBooked = useMemo(() => {
    if (!activeMember?.id || !selectedClass) return false;
    return Boolean(
      selectedClass.bookedMembers?.some(
        (b: any) =>
          (b.uid?.toString() || b._id?.toString() || b.id) === activeMember.id
      )
    );
  }, [activeMember, selectedClass]);

  // Filter packages available for this newly chosen class and in member's holdings
  const eligiblePackages: MemberPackage[] = useMemo(() => {
    if (!activeMember?.packages) return [];
    const nonDeleted = activeMember.packages.filter(
      (p) => p.status !== "DELETED"
    );

    // If a class is chosen, filter by catalog packages that open this class
    if (targetCid && catalogPackages.length > 0) {
      const validCatalogIds = new Set(
        catalogPackages
          .filter((cp) => packageOpensClass(cp, targetCid))
          .map((cp) => cp._id)
      );
      return nonDeleted.filter((p) => validCatalogIds.has(p._id));
    }

    return nonDeleted;
  }, [activeMember, targetCid, catalogPackages]);

  // If a class is chosen that the previously chosen package isn't available for,
  // show and auto-select other packages that ARE available for this newly chosen class.
  useEffect(() => {
    if (!activeMember || loadingInitial) return;
    if (isAlreadyBooked) return;

    if (eligiblePackages.length === 0) {
      if (pkgId) setPkgId("");
      return;
    }

    const isCurrentPkgValid = eligiblePackages.some((p) => p._id === pkgId);
    if (!isCurrentPkgValid) {
      const candidate =
        eligiblePackages.find(
          (p) => p.status === "ACTIVE" && p.remainingClasses > 0
        ) || eligiblePackages[0];
      setPkgId(candidate?._id ?? "");
    }
  }, [eligiblePackages, activeMember, loadingInitial, isAlreadyBooked, pkgId]);

  const handleSave = async () => {
    if (!scan.source || !scan.parentId || !scan.rowId) {
      toast.error("This row cannot be edited");
      return;
    }

    const changes: ScanRowChanges = {};

    // Member reassignment
    if (newMember) {
      changes.uid = newMember.id;
    }

    // Class reassignment
    const isMovingClass =
      selectedScid &&
      selectedScid !== "none" &&
      selectedScid !== scan.parentId;
    if (isMovingClass) {
      changes.targetScid = selectedScid;
    }

    // Package to charge
    if (activeMember) {
      if (!isAlreadyBooked && (isMovingClass || newMember || selectedScid !== "none")) {
        if (eligiblePackages.length === 0 && !isAlreadyBooked) {
          toast.error("No eligible package found for this class");
          return;
        }
        if (eligiblePackages.length > 0 && !pkgId) {
          toast.error("Choose which package to charge");
          return;
        }
      }
      if (pkgId && (pkgId !== scan.pkgId || newMember || isMovingClass)) {
        changes.pkgId = pkgId;
      }
    }

    // Check-in Time
    const originalTime = toLocalInput(scan.time);
    if (time && time !== originalTime) {
      changes.time = new Date(time).toISOString();
    }

    // Status
    if (status !== scan.status) {
      changes.status = status;
    }

    // Guest details
    if (canEditGuest) {
      if (guestName !== scan.member) changes.guestName = guestName;
      if (guestPhone !== scan.phone) changes.guestPhone = guestPhone;
    }

    if (Object.keys(changes).length === 0) {
      toast("Nothing changed");
      setOpen(false);
      return;
    }

    try {
      setSaving(true);
      await updateScanRow(
        { source: scan.source, parentId: scan.parentId, rowId: scan.rowId },
        changes,
      );
      toast.success(isMovingClass ? "Check-in moved to class" : "Check-in updated");
      setOpen(false);
      onSaved?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label="Edit check-in"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit check-in</DialogTitle>
          <DialogDescription>
            Correct a mis-scan. You can edit the member, class, package, time, or status.
            Moving the check-in to another member or class will adjust credits accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current scan summary */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{scan.member}</p>
              <span className="text-xs text-muted-foreground">
                {scan.phone || "No phone"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: <span className="font-medium text-foreground">{scan.method}</span> ·{" "}
              {format(new Date(scan.time), "hh:mm a")}
            </p>
          </div>

          {/* Member section */}
          <div className="space-y-2">
            <Label>Member</Label>
            {newMember ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{newMember.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {newMember.phone || newMember.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setNewMember(null);
                    setPkgId(scan.pkgId ?? "");
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search a different member by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searching ? (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-44 divide-y overflow-y-auto rounded-md border bg-popover shadow-md">
                    {searchResults.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handlePickMember(m)}
                        className="flex w-full items-center justify-between p-2.5 text-left transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {m.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {m.phone || m.email}
                          </p>
                        </div>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {m.activePkgs} active
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Guest fields if open gym guest */}
          {canEditGuest ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="guest-name">Guest name</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-phone">Guest phone</Label>
                <Input
                  id="guest-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {/* Class selection */}
          <div className="space-y-1.5">
            <Label>Class</Label>
            {loadingInitial ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading classes...
              </div>
            ) : (
              <Select value={selectedScid} onValueChange={setSelectedScid}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {scan.source !== "class" && (
                    <SelectItem value="none">
                      {scan.source === "pt"
                        ? "Personal Training (No class)"
                        : "Open Gym (No class)"}
                    </SelectItem>
                  )}
                  {classes.map((cls) => {
                    const timeStr = cls.startTime
                      ? format(new Date(cls.startTime), "hh:mm a")
                      : "";
                    const name = cls.className || "Class";
                    const coach = cls.coachName ? ` (${cls.coachName})` : "";
                    const isCurrent = cls._id === scan.parentId;
                    return (
                      <SelectItem key={cls._id} value={cls._id!}>
                        {name} — {timeStr}
                        {coach} {isCurrent ? "(Current)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Package selection & booking status */}
          {activeMember && selectedScid !== "none" ? (
            isAlreadyBooked ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                <span>
                  {activeMember.name} is already booked in this class. Attendance will be recorded using their existing booking with no extra session charged.
                </span>
              </div>
            ) : eligiblePackages.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                No packages available for this class in {activeMember.name}&apos;s account.
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Package to charge</Label>
                <Select value={pkgId} onValueChange={setPkgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligiblePackages.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} — {p.remainingClasses} left ({p.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedScid !== scan.parentId && (
                  <p className="text-xs text-muted-foreground">
                    1 session will be returned from the previous class and 1 session will be charged on this package.
                  </p>
                )}
              </div>
            )
          ) : activeMember && selectedScid === "none" && eligiblePackages.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Package to charge</Label>
              <Select value={pkgId} onValueChange={setPkgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {eligiblePackages.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — {p.remainingClasses} left ({p.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Check-in time & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scan-time">Check-in time</Label>
              <Input
                id="scan-time"
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "SUCCESS" | "FAILED" | "WILL_PAY")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="WILL_PAY">WILL_PAY</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "FAILED" && scan.status !== "FAILED" ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Marking this failed returns the session to {activeMember?.name || scan.member}.
            </p>
          ) : status === "WILL_PAY" && scan.status === "SUCCESS" ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Marking this WILL_PAY returns the session credit until payment is recorded.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
