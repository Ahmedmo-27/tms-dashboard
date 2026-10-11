"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarIcon, CheckCircle2, Clock, Loader2, Pencil, Search, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { updateScanRow, deleteScanRow, type ScanRowChanges } from "@/lib/data/scan-rows";
import { packageOpensClass } from "@/lib/utils/package-eligibility";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import type { Member, MemberPackage } from "@/components/ui/members/columns";
import type { ClassScan } from "@/components/ui/scans/class-container";
import type { ScheduledClass } from "@/components/ui/schedule/columns";
import type { Package } from "@/components/ui/packages/columns";

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
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(() => {
    const d = new Date(scan.time);
    return isNaN(d.getTime()) ? new Date() : d;
  });
  const [openCalendar, setOpenCalendar] = useState(false);
  const [status, setStatus] = useState<"SUCCESS" | "FAILED" | "WILL_PAY">(
    scan.status ?? "SUCCESS",
  );

  // Guest
  const isGuestRow = Boolean(scan.isGuest || !scan.memberId);
  const [guestName, setGuestName] = useState(isGuestRow ? scan.member : "");
  const [guestPhone, setGuestPhone] = useState(isGuestRow ? scan.phone : "");

  const canEditGuest = isGuestRow && !newMember && scan.source !== "pt";

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoreSession, setRestoreSession] = useState(true);
  const consumesSessionOnScan = scan.source !== "class";
  const wasSuccessful = scan.status !== "FAILED";

  const reset = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setNewMember(null);
    setSelectedScid(
      scan.source === "class" && scan.parentId ? scan.parentId : "none"
    );
    setPkgId(scan.pkgId ?? "");
    const initialDate = new Date(scan.time);
    setSelectedDateTime(isNaN(initialDate.getTime()) ? new Date() : initialDate);
    setOpenCalendar(false);
    setStatus(scan.status ?? "SUCCESS");
    setGuestName(isGuestRow ? scan.member : "");
    setGuestPhone(isGuestRow ? scan.phone : "");
    setShowDeleteConfirm(false);
    setDeleting(false);
    setRestoreSession(true);
  }, [scan, isGuestRow]);

  const handleDelete = async () => {
    if (!scan.source || !scan.parentId || !scan.rowId) {
      toast.error("This row cannot be deleted");
      return;
    }
    try {
      setDeleting(true);
      await deleteScanRow(
        { source: scan.source, parentId: scan.parentId, rowId: scan.rowId },
        restoreSession,
      );
      toast.success("Check-in deleted");
      setOpen(false);
      onSaved?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

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
    let pool = activeMember.packages.filter(
      (p) => p.status !== "DELETED"
    );

    // If a class is chosen, filter by catalog packages that open this class
    if (targetCid && catalogPackages.length > 0) {
      const validCatalogIds = new Set(
        catalogPackages
          .filter((cp) => packageOpensClass(cp, targetCid))
          .map((cp) => cp._id)
      );
      pool = pool.filter((p) => validCatalogIds.has(p._id));
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
    const originalTime = new Date(scan.time).getTime();
    if (!isNaN(originalTime) && Math.abs(selectedDateTime.getTime() - originalTime) > 1000) {
      changes.time = selectedDateTime.toISOString();
    }

    // Status
    if (status !== scan.status) {
      changes.status = status;
    }

    // Guest / Walk-in details
    if (canEditGuest) {
      const trimmedName = guestName.trim();
      if (trimmedName && trimmedName !== scan.member) {
        changes.guestName = trimmedName;
        changes.name = trimmedName;
      }
      const trimmedPhone = guestPhone.trim();
      const originalPhone = scan.phone === "No Phone" ? "" : scan.phone;
      if (trimmedPhone !== originalPhone) {
        changes.guestPhone = trimmedPhone;
        changes.phoneNumber = trimmedPhone;
      }
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

      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-x-hidden overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>Edit check-in</DialogTitle>
          <DialogDescription>
            Correct a mis-scan. You can edit the member, class, package, time, or status.
            Moving the check-in to another member or class will adjust credits accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 w-full min-w-0 max-w-full">
          {/* Current scan summary */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <p className="font-semibold truncate min-w-0">{scan.member}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {scan.phone || "No phone"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate min-w-0">
              Current: <span className="font-medium text-foreground">{scan.method}</span> ·{" "}
              {format(new Date(scan.time), "hh:mm a")}
            </p>
          </div>

          {/* Guest / Walk-in fields */}
          {canEditGuest ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="guest-name">
                  {scan.source === "class" ? "Walk-in Name" : "Guest Name"}
                </Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full min-w-0"
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="guest-phone">Phone Number</Label>
                <Input
                  id="guest-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full min-w-0"
                />
              </div>
            </div>
          ) : null}

          {/* Member section */}
          <div className="space-y-2">
            <Label>
              {isGuestRow
                ? "Reassign to a registered member (optional)"
                : "Member"}
            </Label>
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
                    placeholder={
                      isGuestRow
                        ? "Search a registered member by name or phone to reassign..."
                        : "Search a different member by name or phone..."
                    }
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

          {/* Class selection */}
          <div className="space-y-1.5 min-w-0">
            <Label>Class</Label>
            {loadingInitial ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading classes...
              </div>
            ) : (
              <Select value={selectedScid} onValueChange={setSelectedScid}>
                <SelectTrigger className="w-full min-w-0 h-auto min-h-9 py-2 text-left whitespace-normal leading-snug *:data-[slot=select-value]:line-clamp-2 *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:text-left *:data-[slot=select-value]:break-words">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
                  {scan.source !== "class" && (
                    <SelectItem value="none">
                      <span className="line-clamp-2 break-words whitespace-normal text-left">
                        {scan.source === "pt"
                          ? "Personal Training (No class)"
                          : "Open Gym (No class)"}
                      </span>
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
                        <span className="line-clamp-2 break-words whitespace-normal text-left">
                          {name} — {timeStr}
                          {coach} {isCurrent ? " (Current)" : ""}
                        </span>
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
              <div className="space-y-1.5 min-w-0">
                <Label>Package to charge</Label>
                <Select value={pkgId} onValueChange={setPkgId}>
                  <SelectTrigger className="w-full min-w-0 h-auto min-h-9 py-2 text-left whitespace-normal leading-snug *:data-[slot=select-value]:line-clamp-2 *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:text-left *:data-[slot=select-value]:break-words">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
                    {eligiblePackages.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        <span className="line-clamp-2 break-words whitespace-normal text-left">
                          {p.name} — {p.remainingClasses} left{p.status !== "ACTIVE" ? ` (${p.status})` : ""}
                        </span>
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
            <div className="space-y-1.5 min-w-0">
              <Label>Package to charge</Label>
              <Select value={pkgId} onValueChange={setPkgId}>
                <SelectTrigger className="w-full min-w-0 h-auto min-h-9 py-2 text-left whitespace-normal leading-snug *:data-[slot=select-value]:line-clamp-2 *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:text-left *:data-[slot=select-value]:break-words">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
                  {eligiblePackages.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      <span className="line-clamp-2 break-words whitespace-normal text-left">
                        {p.name} — {p.remainingClasses} left{p.status !== "ACTIVE" ? ` (${p.status})` : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Check-in time & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="scan-time-btn">Check-in time</Label>
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    id="scan-time-btn"
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-9 px-3 text-xs sm:text-sm min-w-0"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {format(selectedDateTime, "MMM d, yyyy · hh:mm a")}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-[70] w-auto p-0"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  collisionPadding={16}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    e.preventDefault();
                    setOpenCalendar(false);
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDateTime}
                    onSelect={(d) => {
                      if (d) {
                        const updated = new Date(d);
                        updated.setHours(
                          selectedDateTime.getHours(),
                          selectedDateTime.getMinutes(),
                          selectedDateTime.getSeconds(),
                          0
                        );
                        setSelectedDateTime(updated);
                      }
                    }}
                    initialFocus
                    className="rounded-md"
                  />
                  <div className="p-3 border-t bg-muted/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={format(selectedDateTime, "HH:mm")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [h, m] = val.split(":").map(Number);
                            if (!isNaN(h) && !isNaN(m)) {
                              const updated = new Date(selectedDateTime);
                              updated.setHours(h, m, 0, 0);
                              setSelectedDateTime(updated);
                            }
                          }
                        }}
                        className="h-8 w-28 text-xs px-2"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs px-2.5"
                        onClick={() => setOpenCalendar(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "SUCCESS" | "FAILED" | "WILL_PAY")
                }
              >
                <SelectTrigger className="w-full h-9 min-w-0 text-xs sm:text-sm">
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

        {showDeleteConfirm ? (
          <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2 text-sm mt-2">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Are you sure you want to delete this check-in?</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This will remove the check-in record for {scan.member}.
            </p>
            {consumesSessionOnScan && wasSuccessful ? (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="modal-restore-session"
                  checked={restoreSession}
                  onCheckedChange={(v) => setRestoreSession(v === true)}
                />
                <Label htmlFor="modal-restore-session" className="text-xs cursor-pointer">
                  Return the session to the member
                </Label>
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete scan
            </Button>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving || deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || loadingInitial || deleting}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
