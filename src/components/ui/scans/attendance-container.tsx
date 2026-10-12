"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "../scroll-area";
import { cn } from "@/lib/utils";
import { Users, UserCheck, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ClassScan } from "./class-container";
import { BranchPill } from "../branch-pill";
import { CopyAttendanceForSheetButton } from "./copy-attendance-for-sheet-button";
import { ScanMemberLink } from "./scan-member-link";
import { EditScanRow } from "../dialogs/scans/edit-scan-row";
import { Button } from "@/components/ui/button";
import { deleteScanRow } from "@/lib/data/scan-rows";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import toast from "react-hot-toast";
import type { MethodSheetMapping } from "@/lib/utils/copy-class-for-sheet";
import type { ScheduledClass } from "@/components/ui/schedule/columns";

export interface AttendanceContainerProps {
  title: string;
  classScans: ClassScan[];
  availableClasses?: ScheduledClass[];
  headerActions?: ReactNode;
  sheetCopy?: {
    mapMethod: (method: string) => MethodSheetMapping;
    classPrice?: string;
  };
  emptyMessage?: string;
  memberHrefBuilder?: (memberId: string) => string;
  onSelect?: (scan: ClassScan) => void;
  dataWalkthrough?: string;
  rowWalkthrough?: string;
}

export const AttendanceContainer = ({
  title,
  classScans,
  availableClasses,
  headerActions,
  sheetCopy,
  showBranch = false,
  emptyMessage,
  memberHrefBuilder,
  onSelect,
  dataWalkthrough,
  rowWalkthrough,
  onRefresh,
}: AttendanceContainerProps & {
  showBranch?: boolean;
  onRefresh?: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [removingRowId, setRemovingRowId] = useState<string | null>(null);

  const handleRemoveFailedScan = async (scan: ClassScan) => {
    if (!scan.source || !scan.parentId || !scan.rowId) return;
    try {
      setRemovingRowId(scan.rowId);
      await deleteScanRow(
        { source: scan.source, parentId: scan.parentId, rowId: scan.rowId },
        false
      );
      toast.success("Failed scan removed");
      onRefresh?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setRemovingRowId(null);
    }
  };

  const filteredScans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classScans;
    const cleanQ = q.replace(/[\s\-+]/g, "");
    return classScans.filter((scan) => {
      const name = (scan.member || "").toLowerCase();
      const phone = scan.phone || "";
      const cleanPhone = phone.replace(/[\s\-+]/g, "");

      const matchesName = name.includes(q);
      const matchesPhone =
        phone.toLowerCase().includes(q) ||
        (cleanQ.length > 0 && cleanPhone.includes(cleanQ));

      return matchesName || matchesPhone;
    });
  }, [classScans, searchQuery]);

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
  return (
    <Card data-walkthrough={dataWalkthrough} className="w-full">
      <CardHeader className="space-y-3 p-4">
        {/* Name */}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {headerActions}
          {sheetCopy ? (
            <CopyAttendanceForSheetButton
              scans={classScans}
              mapMethod={sheetCopy.mapMethod}
              classPrice={sheetCopy.classPrice}
            />
          ) : null}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Bookings */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-0.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {classScans?.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY" || scan.status === "FOC").length || 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              <span>{classScans?.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY" || scan.status === "FOC").length || 0} checked in</span>
            </div>
          </div>
          {searchQuery.trim() && (
            <span className="text-xs font-medium text-muted-foreground">
              {filteredScans.length} of {classScans.length} shown
            </span>
          )}
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
                  {showBranch ? <TableHead>Branch</TableHead> : null}
                  <TableHead>Check-in Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classScans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showBranch ? 7 : 6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {emptyMessage ?? "No check-ins yet. Use Quick actions or a member QR to record one."}
                    </TableCell>
                  </TableRow>
                ) : filteredScans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showBranch ? 7 : 6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 text-xs">
                        <span>No members matching &quot;{searchQuery}&quot;</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-primary hover:underline font-medium"
                        >
                          Clear search
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScans.map((scan, index) => (
                    <TableRow
                      key={index}
                      data-walkthrough={rowWalkthrough}
                      className={cn(onSelect && "cursor-pointer")}
                      onClick={() => onSelect?.(scan)}
                    >
                      <TableCell>
                        <ScanMemberLink
                          name={scan.member}
                          memberId={scan.memberId}
                          href={memberHrefBuilder && scan.memberId ? memberHrefBuilder(scan.memberId) : undefined}
                        />
                      </TableCell>
                      <TableCell>{scan.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span>{scan.method}</span>
                          {scan.remainingClasses !== undefined && scan.remainingClasses !== null && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {scan.totalClasses
                                ? `${scan.remainingClasses} out of ${scan.totalClasses} remaining`
                                : `${scan.remainingClasses} remaining`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {showBranch ? (
                        <TableCell>
                          {scan.branchLabel ? (
                            <BranchPill label={scan.branchLabel} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ) : null}
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
                            {scan.status === "FAILED" && scan.rowId && scan.parentId && scan.source && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                disabled={removingRowId === scan.rowId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFailedScan(scan);
                                }}
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
                          <div
                            className="flex items-center justify-end"
                            // The row itself is clickable now; a correction
                            // must not also trigger its onSelect.
                            onClick={(e) => e.stopPropagation()}
                          >
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
