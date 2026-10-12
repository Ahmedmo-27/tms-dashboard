"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "../scroll-area";
import { cn } from "@/lib/utils";
import { mapMethodToSheetLabel } from "@/lib/utils/copy-class-for-sheet";
import { Clock, Users, UserCheck, X, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { ScheduledClass } from "../schedule/columns";
import { format } from "date-fns";
import { CheckInsSelector } from "../dialogs/scans/check-in-selector";
import { PaymentSelectorDialog } from "../dialogs/scans/payment-selector-dialog";
import { BranchPill } from "../branch-pill";
import { CopyAttendanceForSheetButton } from "./copy-attendance-for-sheet-button";
import { ScanMemberLink } from "./scan-member-link";
import { AddWalkIn } from "../dialogs/scans/add-walk-in";
import { EditScanRow } from "../dialogs/scans/edit-scan-row";
import { removeFailedScan, updateNonUserBookingPhone, updateNonUserBookingName } from "@/lib/data/bookings";
import { deleteScanRow } from "@/lib/data/scan-rows";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { toast } from "react-hot-toast";

/** Which Scans Monitor table a row came from; picks the correction endpoint. */
export type ScanSource = "class" | "pt" | "open-gym";

export interface ClassScan {
  member: string;
  memberId?: string;
  phone: string;
  time: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY" | "FOC";
  statusDetail?: string;
  bookingId?: string;
  branchLabel?: string;
  remainingClasses?: number | null;
  totalClasses?: number | null;
  /** Row identity, so the front desk can correct or delete this check-in. */
  source?: ScanSource;
  /** Scheduled class id for class rows, daily attendance document id otherwise. */
  parentId?: string;
  rowId?: string;
  /** Package the visit was charged to, when the row records it. */
  pkgId?: string;
  isGuest?: boolean;
}

export interface ClassContainerProps {
  classData: ScheduledClass;
  classScans: ClassScan[];
  availableClasses?: ScheduledClass[];
}

function EditWalkInNamePopover({
  bookingId,
  currentName,
  onSuccess,
}: {
  bookingId: string;
  currentName: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      setSaving(true);
      await updateNonUserBookingName(bookingId, name.trim());
      toast.success("Walk-in name updated");
      setOpen(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setName(currentName);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors inline-flex items-center"
          title="Edit walk-in name"
          aria-label="Edit walk-in name"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <p className="text-sm font-medium">Edit Walk-in Name</p>
        <Input
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MissingPhonePopover({
  bookingId,
  onSuccess,
}: {
  bookingId?: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!bookingId) return;
    if (!/^\d{11}$/.test(phone.trim())) {
      toast.error("Please enter a valid 11-digit phone number");
      return;
    }
    try {
      setSaving(true);
      await updateNonUserBookingPhone(bookingId, phone.trim());
      toast.success("Phone number saved");
      setOpen(false);
      setPhone("");
      onSuccess?.();
    } catch {
      toast.error("Failed to save phone number");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer">
          <Badge
            variant="outline"
            className="gap-1 border-amber-500 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
          >
            <AlertTriangle className="h-3 w-3" />
            Missing Phone
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <p className="text-sm font-medium">Add Phone Number</p>
        <Input
          placeholder="01xxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          maxLength={11}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const ClassContainer = ({
  classData,
  classScans,
  availableClasses,
  showBranch = false,
  onRefresh,
}: ClassContainerProps & { showBranch?: boolean; onRefresh?: () => void }) => {
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const handleRemoveFailedScan = async (scan: ClassScan) => {
    const targetKey = scan.rowId || scan.memberId;
    if (!targetKey) return;
    try {
      setRemovingUid(targetKey);
      if (scan.rowId && scan.parentId && scan.source) {
        await deleteScanRow(
          { source: scan.source, parentId: scan.parentId, rowId: scan.rowId },
          false
        );
      } else if (scan.memberId) {
        const scid = String(classData._id);
        await removeFailedScan(scan.memberId, scid);
      }
      toast.success("Failed scan removed");
      onRefresh?.();
    } catch (err) {
      toast.error((err as Error).message || "Failed to remove scan");
    } finally {
      setRemovingUid(null);
    }
  };

  const getStatusColor = (status: ClassScan["status"]) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "WILL_PAY":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "FOC":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      default:
        return "";
    }
  };

  const startTimeMs = new Date(classData.startTime).getTime();
  const endTimeMs = new Date(classData.endTime).getTime();
  const halfwayMs =
    !isNaN(startTimeMs) && !isNaN(endTimeMs)
      ? startTimeMs + (endTimeMs - startTimeMs) / 2
      : 0;
  const isPastHalfway = halfwayMs > 0 && Date.now() >= halfwayMs;
  const attendanceConfirmation = classData.attendanceConfirmation;
  const successScanCount = classScans.filter(
    (s) => s.status === "SUCCESS" || s.status === "WILL_PAY" || s.status === "FOC"
  ).length;
  // Recompute the actual discrepancy live (headcount vs scans) so stale DB
  // records from the old booking-based logic don't produce false alarms,
  // while honoring manual discrepancy flags when headcount differs from scans.
  const isActuallyMissing =
    attendanceConfirmation?.confirmed === true &&
    (attendanceConfirmation.confirmedCount < successScanCount ||
      (Boolean(attendanceConfirmation.hasMissingPlace) &&
        attendanceConfirmation.confirmedCount !== successScanCount));

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3 p-4">
        {/* Name */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{classData.className}</h3>
          {showBranch && classData.location ? (
            <BranchPill label={classData.location} />
          ) : null}
          <Badge variant="outline" className="font-normal">
            {classData.coachName}
          </Badge>

          {/* Attendance Confirmation Mark for Management & Branch Admin */}
          {attendanceConfirmation?.confirmed ? (
            isActuallyMissing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="cursor-pointer">
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-500/60 dark:text-amber-400 dark:bg-amber-950/40 font-medium"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Missing Place ({attendanceConfirmation.confirmedCount}/{successScanCount})
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 text-xs space-y-1.5" align="start">
                  <p className="font-semibold text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Missing Place
                  </p>
                  <p className="text-muted-foreground">
                    Confirmed Headcount:{" "}
                    <span className="font-medium text-foreground">
                      {attendanceConfirmation.confirmedCount}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Scanned In:{" "}
                    <span className="font-medium text-foreground">
                      {successScanCount}
                    </span>
                  </p>
                  {attendanceConfirmation.confirmedAt ? (
                    <p className="text-muted-foreground">
                      Confirmed at:{" "}
                      {format(new Date(attendanceConfirmation.confirmedAt), "hh:mm a")}
                    </p>
                  ) : null}
                  {attendanceConfirmation.notes ? (
                    <p className="text-muted-foreground border-t pt-1 mt-1 italic">
                      "{attendanceConfirmation.notes}"
                    </p>
                  ) : null}
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="cursor-pointer">
                    <Badge
                      variant="outline"
                      className="gap-1 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500/60 dark:text-emerald-400 dark:bg-emerald-950/40 font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Attendance Confirmed ({attendanceConfirmation.confirmedCount})
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 text-xs space-y-1.5" align="start">
                  <p className="font-semibold text-sm flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Attendance Confirmed
                  </p>
                  <p className="text-muted-foreground">
                    Confirmed Headcount:{" "}
                    <span className="font-medium text-foreground">
                      {attendanceConfirmation.confirmedCount}
                    </span>
                  </p>
                  {attendanceConfirmation.confirmedAt ? (
                    <p className="text-muted-foreground">
                      Confirmed at:{" "}
                      {format(new Date(attendanceConfirmation.confirmedAt), "hh:mm a")}
                    </p>
                  ) : null}
                  {attendanceConfirmation.notes ? (
                    <p className="text-muted-foreground border-t pt-1 mt-1 italic">
                      "{attendanceConfirmation.notes}"
                    </p>
                  ) : null}
                </PopoverContent>
              </Popover>
            )
          ) : isPastHalfway ? (
            <Badge
              variant="outline"
              className="gap-1 border-dashed text-muted-foreground text-xs font-normal"
              title="Session is past halfway; coach attendance confirmation pending"
            >
              <Clock className="h-3 w-3" />
              Awaiting Confirmation
            </Badge>
          ) : null}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <CheckInsSelector
            members={classData.bookedMembers}
            classData={classData}
            onRefresh={onRefresh}
          />
          <AddWalkIn
            scid={String(classData._id)}
            compact
            classTitle={classData.className}
            startTime={classData.startTime}
            onSuccess={onRefresh}
          />
          <CopyAttendanceForSheetButton
            scans={classScans}
            mapMethod={mapMethodToSheetLabel}
            classPrice={classData.classPrice}
          />
        </div>

        {/* Bookings */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-0.5">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(classData.startTime).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {classScans.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY" || scan.status === "FOC").length}/{classData.bookedMembers.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            <span>{classScans.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY" || scan.status === "FOC").length} checked in</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[220px] rounded-md border">
          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classScans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No check-ins yet. Use Check in or Walk-in above.
                    </TableCell>
                  </TableRow>
                ) : (
                  classScans.map((scan, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ScanMemberLink name={scan.member} memberId={scan.memberId} />
                          {!scan.memberId && scan.bookingId ? (
                            <EditWalkInNamePopover
                              bookingId={scan.bookingId}
                              currentName={scan.member}
                              onSuccess={onRefresh}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {scan.phone && scan.phone !== "No Phone" ? (
                          scan.phone
                        ) : (
                          <MissingPhonePopover
                            bookingId={scan.bookingId}
                            onSuccess={onRefresh}
                          />
                        )}
                      </TableCell>
                      <TableCell>{scan.method}</TableCell>
                      <TableCell>
                        {format(new Date(scan.time), "hh:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={cn(
                                "font-normal",
                                getStatusColor(scan.status)
                              )}
                            >
                              {scan.status}
                            </Badge>
                            {scan.status === "WILL_PAY" && scan.bookingId ? (
                              <PaymentSelectorDialog
                                bookingId={scan.bookingId}
                                initialPhone={scan.phone && scan.phone !== "No Phone" ? scan.phone : ""}
                                scid={scan.parentId || classData._id}
                                targetCid={classData.cid}
                                className={classData.className}
                                onSuccess={onRefresh}
                              />
                            ) : null}
                            {scan.status === "FAILED" && (scan.rowId || scan.memberId) && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 text-red-500 hover:bg-red-50 hover:text-red-700"
                                disabled={removingUid === (scan.rowId || scan.memberId)}
                                onClick={() => handleRemoveFailedScan(scan)}
                                aria-label="Remove failed scan"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          {scan.statusDetail ? (
                            <span className="text-xs text-muted-foreground max-w-[160px] text-right">
                              {scan.statusDetail}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {scan.rowId && scan.parentId ? (
                          <div className="flex items-center justify-end">
                            <EditScanRow
                              scan={scan}
                              availableClasses={availableClasses}
                              onSaved={onRefresh}
                            />
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
