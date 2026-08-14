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
import { ScrollArea, ScrollBar } from "../scroll-area";
import { cn } from "@/lib/utils";
import { Users, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ClassScan } from "./class-container";
import { BranchPill } from "../branch-pill";
import { CopyMemberForSheetButton } from "./copy-member-for-sheet-button";
import { ScanMemberLink } from "./scan-member-link";
import type { MethodSheetMapping } from "@/lib/utils/copy-class-for-sheet";

export interface AttendanceContainerProps {
  title: string;
  classScans: ClassScan[];
  headerActions?: ReactNode;
  sheetCopy?: {
    mapMethod: (method: string) => MethodSheetMapping;
    classPrice?: string;
  };
}

export const AttendanceContainer = ({
  title,
  classScans,
  headerActions,
  sheetCopy,
  showBranch = false,
}: AttendanceContainerProps & { showBranch?: boolean }) => {
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {headerActions}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {classScans?.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY").length || 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              <span>{classScans?.filter((scan) => scan.status === "SUCCESS" || scan.status === "WILL_PAY").length || 0} checked in</span>
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
                  {showBranch ? <TableHead>Branch</TableHead> : null}
                  <TableHead>Check-in Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  {sheetCopy ? <TableHead className="text-right">Sheet</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classScans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={(showBranch ? 6 : 5) + (sheetCopy ? 1 : 0)}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No check-ins yet. Use Quick actions or a member QR to record one.
                    </TableCell>
                  </TableRow>
                ) : (
                  classScans.map((scan, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <ScanMemberLink name={scan.member} memberId={scan.memberId} />
                      </TableCell>
                      <TableCell>{scan.phone}</TableCell>
                      <TableCell>{scan.method}</TableCell>
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
                          <Badge
                            className={cn(
                              "font-normal",
                              getStatusColor(scan.status)
                            )}
                          >
                            {scan.status}
                          </Badge>
                          {scan.statusDetail ? (
                            <span className="text-xs text-muted-foreground max-w-[160px] text-right">
                              {scan.statusDetail}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      {sheetCopy ? (
                        <TableCell className="text-right">
                          <CopyMemberForSheetButton
                            scan={scan}
                            mapMethod={sheetCopy.mapMethod}
                            classPrice={sheetCopy.classPrice}
                          />
                        </TableCell>
                      ) : null}
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
