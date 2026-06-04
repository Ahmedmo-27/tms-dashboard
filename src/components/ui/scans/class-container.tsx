import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../button";
import { ScrollArea, ScrollBar } from "../scroll-area";
import { cn } from "@/lib/utils";
import { Clock, Users, UserCheck } from "lucide-react";
import { ScheduledClass } from "../schedule/columns";
import { format } from "date-fns";
import { CheckInsSelector } from "../dialogs/scans/check-in-selector";
import { PaymentSelectorDialog } from "../dialogs/scans/payment-selector-dialog";

export interface ClassScan {
  member: string;
  phone: string;
  time: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY";
  bookingId?: string;
}

export interface ClassContainerProps {
  classData: ScheduledClass;
  classScans: ClassScan[];
}

export const ClassContainer = ({
  classData,
  classScans,
}: ClassContainerProps) => {
  const getStatusColor = (status: ClassScan["status"]) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
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
              <Badge variant="outline" className="font-normal">
                {classData.coachName}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckInsSelector members={classData.bookedMembers} classData={classData} />
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
                  {classScans.length}/{classData.bookedMembers.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                <span>{classScans.length} checked in</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[250px] rounded-md border">
          <div className="p-4">
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
                      No members checked in yet
                    </TableCell>
                  </TableRow>
                ) : (
                  classScans.map((scan, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {scan.member}
                      </TableCell>
                      <TableCell>{scan.phone}</TableCell>
                      <TableCell>{scan.method}</TableCell>
                      <TableCell>
                        {format(new Date(scan.time), "hh:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        {(scan.status === "WILL_PAY" && scan.bookingId) ? (
                          <PaymentSelectorDialog bookingId={scan.bookingId} />
                        ) : (
                          <Badge
                            className={cn(
                              "font-normal",
                              getStatusColor(scan.status)
                            )}
                          >
                            {scan.status}
                          </Badge>
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
