"use client";

import { FreezeRequestItem } from "@/lib/data/freeze";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ApproveFreezeDialog } from "../dialogs/freeze/approve-freeze-dialog";
import { RejectFreezeDialog } from "../dialogs/freeze/reject-freeze-dialog";
import { Snowflake, Calendar, User, Phone, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300",
};

export function FreezeRequestsTable({
  requests,
  onRefresh,
}: {
  requests: FreezeRequestItem[];
  onRefresh?: () => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Snowflake className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-base">No freeze requests found</p>
        <p className="text-sm">Extra freeze requests submitted by members will appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[180px]">Member</TableHead>
            <TableHead className="min-w-[140px]">Package</TableHead>
            <TableHead className="min-w-[120px]">Branch</TableHead>
            <TableHead className="min-w-[140px]">Requested Duration</TableHead>
            <TableHead className="min-w-[200px]">Reason</TableHead>
            <TableHead className="min-w-[110px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Date</TableHead>
            <TableHead className="text-right min-w-[160px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const weeks = (req.requestedDurationDays / 7).toFixed(1).replace(/\.0$/, "");
            const memberId = req.memberId?._id ?? "";
            const memberName = req.memberId?.name ?? "Unknown";
            const memberPhone = req.memberId?.phoneNumber ?? "—";
            const branchName = req.locationId?.branchName ?? "All Branches";

            return (
              <TableRow key={req._id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex flex-col">
                    {memberId ? (
                      <Link
                        href={`/dashboard/our-members/${memberId}`}
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {memberName}
                      </Link>
                    ) : (
                      <span className="font-medium">{memberName}</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      {memberPhone}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-medium text-sm">{req.pkgName}</span>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <MapPin className="h-3 w-3" />
                    {branchName}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      {req.requestedDurationDays} Days
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (~{weeks} {Number(weeks) === 1 ? "Week" : "Weeks"})
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="max-w-[260px]">
                    <p className="text-xs text-muted-foreground line-clamp-2 italic" title={req.reason}>
                      "{req.reason}"
                    </p>
                    {req.adminNote && (
                      <p className="text-[11px] text-primary/80 mt-1">
                        <strong>Admin note:</strong> {req.adminNote}
                      </p>
                    )}
                    {req.rejectionReason && (
                      <p className="text-[11px] text-destructive mt-1">
                        <strong>Declined:</strong> {req.rejectionReason}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium", STATUS_COLORS[req.status] || "")}
                  >
                    {req.status}
                    {req.status === "APPROVED" && req.approvedDurationDays && (
                      <span className="ml-1 text-[11px] opacity-90">
                        ({req.approvedDurationDays}d)
                      </span>
                    )}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {req.createdAt ? format(new Date(req.createdAt), "dd MMM yyyy") : "—"}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {req.status === "PENDING" ? (
                    <div className="flex items-center justify-end gap-2" data-walkthrough="freeze-request-actions">
                      <ApproveFreezeDialog request={req} onSuccess={onRefresh} />
                      <RejectFreezeDialog request={req} onSuccess={onRefresh} />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Reviewed by {req.reviewedBy?.name ?? "Admin"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
