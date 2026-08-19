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
import { Clock, Users, UserCheck, X, AlertTriangle } from "lucide-react";
import { ScheduledClass } from "../schedule/columns";
import { format } from "date-fns";
import { CheckInsSelector } from "../dialogs/scans/check-in-selector";
import { PaymentSelectorDialog } from "../dialogs/scans/payment-selector-dialog";
import { BranchPill } from "../branch-pill";
import { CopyAttendanceForSheetButton } from "./copy-attendance-for-sheet-button";
import { ScanMemberLink } from "./scan-member-link";
import { AddWalkIn } from "../dialogs/scans/add-walk-in";
import { removeFailedScan } from "@/lib/data/bookings";
import { useState } from "react";
import { toast } from "react-hot-toast";

export interface ClassScan {
  member: string;
  memberId?: string;
  phone: string;
  time: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY";
  statusDetail?: string;
  bookingId?: string;
  branchLabel?: string;
}

export interface ClassContainerProps {
  classData: ScheduledClass;
  classScans: ClassScan[];
}

export const ClassContainer = ({
  classData,
  classScans,
  showBranch = false,
  onRefresh,
}: ClassContainerProps & { showBranch?: boolean; onRefresh?: () => void }) => {
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const handleRemoveFailedScan = async (uid: string) => {
    const scid = String(classData._id);
    try {
      setRemovingUid(uid);
      await removeFailedScan(uid, scid);
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
      default:
        return "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4 p-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{classData.className}</h3>
              {showBranch && classData.location ? (
                <BranchPill label={classData.location} />
              ) : null}
              <Badge variant="outline" className="font-normal">
                {classData.coachName}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CheckInsSelector members={classData.bookedMembers} classData={classData} />
              <AddWalkIn scid={String(classData._id)} compact />
              <CopyAttendanceForSheetButton
                scans={classScans}
                mapMethod={mapMethodToSheetLabel}
                classPrice={classData.classPrice}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(classData.startTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {classScans.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY").length}/{classData.bookedMembers.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                <span>{classScans.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY").length} checked in</span>
              </div>
            </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {classScans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No check-ins yet. Use Check in or Walk-in above.
                    </TableCell>
                  </TableRow>
                ) : (
                  classScans.map((scan, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <ScanMemberLink name={scan.member} memberId={scan.memberId} />
                      </TableCell>
                      <TableCell>
                        {scan.phone ? (
                          scan.phone
                        ) : (
                          <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Missing Phone
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{scan.method}</TableCell>
                      <TableCell>
                        {format(new Date(scan.time), "hh:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        {(scan.status === "WILL_PAY" && scan.bookingId) ? (
                          <PaymentSelectorDialog bookingId={scan.bookingId} />
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <Badge
                                className={cn(
                                  "font-normal",
                                  getStatusColor(scan.status)
                                )}
                              >
                                {scan.status}
                              </Badge>
                              {scan.status === "FAILED" && scan.memberId && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-red-500 hover:bg-red-50 hover:text-red-700"
                                  disabled={removingUid === scan.memberId}
                                  onClick={() => handleRemoveFailedScan(scan.memberId!)}
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
                        )}
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
