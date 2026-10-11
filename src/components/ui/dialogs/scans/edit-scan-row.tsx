"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Loader2, Pencil, Search, User } from "lucide-react";

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
import { updateScanRow, type ScanRowChanges } from "@/lib/data/scan-rows";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import type { Member, MemberPackage } from "@/components/ui/members/columns";
import type { ClassScan } from "@/components/ui/scans/class-container";

/** Datetime-local wants the wall clock, not an ISO instant. */
function toLocalInput(value: string): string {
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd'T'HH:mm");
}

export function EditScanRow({
  scan,
  onSaved,
}: {
  scan: ClassScan;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Member reassignment
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [newMember, setNewMember] = useState<Member | null>(null);

  const [pkgId, setPkgId] = useState<string>(scan.pkgId ?? "");
  const [time, setTime] = useState<string>(toLocalInput(scan.time));
  const [status, setStatus] = useState<"SUCCESS" | "FAILED">(
    scan.status === "FAILED" ? "FAILED" : "SUCCESS",
  );
  const [guestName, setGuestName] = useState(scan.isGuest ? scan.member : "");
  const [guestPhone, setGuestPhone] = useState(scan.isGuest ? scan.phone : "");

  const isClassRow = scan.source === "class";
  const canEditGuest = scan.source === "open-gym" && scan.isGuest;

  const reset = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setNewMember(null);
    setPkgId(scan.pkgId ?? "");
    setTime(toLocalInput(scan.time));
    setStatus(scan.status === "FAILED" ? "FAILED" : "SUCCESS");
    setGuestName(scan.isGuest ? scan.member : "");
    setGuestPhone(scan.isGuest ? scan.phone : "");
  }, [scan]);

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

  // Once a different member is picked, the package must come from their own
  // holdings — the previous member's package id means nothing to them.
  const packageOptions: MemberPackage[] = useMemo(
    () => newMember?.packages?.filter((p) => p.status !== "DELETED") ?? [],
    [newMember],
  );

  const handlePickMember = (member: Member) => {
    setNewMember(member);
    setSearchResults([]);
    setSearchQuery("");
    const firstActive = member.packages?.find((p) => p.status === "ACTIVE");
    setPkgId(firstActive?._id ?? "");
  };

  const handleSave = async () => {
    if (!scan.source || !scan.parentId || !scan.rowId) {
      toast.error("This row cannot be edited");
      return;
    }

    const changes: ScanRowChanges = {};

    if (newMember) {
      changes.uid = newMember.id;
      // Non-class rows charge at scan time, so the API needs the target package.
      if (!isClassRow) {
        if (!pkgId) {
          toast.error("Choose which package to charge");
          return;
        }
        changes.pkgId = pkgId;
      } else if (pkgId) {
        changes.pkgId = pkgId;
      }
    } else if (pkgId && pkgId !== scan.pkgId) {
      changes.pkgId = pkgId;
    }

    const originalTime = toLocalInput(scan.time);
    if (time && time !== originalTime) {
      changes.time = new Date(time).toISOString();
    }

    const originalStatus = scan.status === "FAILED" ? "FAILED" : "SUCCESS";
    if (status !== originalStatus) changes.status = status;

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
      toast.success("Check-in updated");
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
        // Reset on open, not on close: saving closes the dialog programmatically,
        // which never fires onOpenChange, so a close-time reset would leave the
        // previous edit staged the next time this row is opened.
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
            Correct a mis-scan. Moving the check-in to another member returns the
            session to the original member and charges the new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{scan.member}</p>
            <p className="text-xs text-muted-foreground">
              {scan.phone} · {scan.method}
            </p>
          </div>

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

          <div className="space-y-2">
            <Label>Member</Label>
            {newMember ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{newMember.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {newMember.phone}
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

          {newMember ? (
            <div className="space-y-1.5">
              <Label>Package to charge</Label>
              {packageOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {newMember.name} has no packages to charge.
                </p>
              ) : (
                <Select value={pkgId} onValueChange={setPkgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} — {p.remainingClasses} left ({p.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : null}

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
                onValueChange={(v) => setStatus(v as "SUCCESS" | "FAILED")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "FAILED" && scan.status !== "FAILED" ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Marking this failed returns the session to {scan.member}.
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
