"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Search,
  Filter,
  Droplets,
  Layers,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MaintenanceLogEntry,
  MaintenanceItemId,
} from "@/lib/data/maintenance";

interface MaintenanceHistoryTableProps {
  logs: MaintenanceLogEntry[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  showBranchColumn?: boolean;
}

const ITEM_ICONS: Record<
  MaintenanceItemId,
  React.ComponentType<{ className?: string }>
> = {
  showers_bottles: Droplets,
  towels: Layers,
  communal_area: Sparkles,
  gym_prepared: Dumbbell,
};

export function MaintenanceHistoryTable({
  logs,
  selectedDate,
  onDateChange,
  showBranchColumn = true,
}: MaintenanceHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter((log) => {
    const branchName =
      typeof log.locationId === "object" && log.locationId !== null
        ? log.locationId.branchName
        : "";
    const staffName = log.lastUpdatedByName || "";
    const notes = log.notes || "";
    const matchTerm = searchTerm.toLowerCase();

    return (
      branchName.toLowerCase().includes(matchTerm) ||
      staffName.toLowerCase().includes(matchTerm) ||
      notes.toLowerCase().includes(matchTerm)
    );
  });

  const formatHourRange = (h: number) => {
    const startPeriod = h >= 12 ? "PM" : "AM";
    const startHour12 = h % 12 === 0 ? 12 : h % 12;
    const nextH = (h + 1) % 24;
    const endPeriod = nextH >= 12 ? "PM" : "AM";
    const endHour12 = nextH % 12 === 0 ? 12 : nextH % 12;
    return `${startHour12}:00 ${startPeriod} – ${endHour12}:00 ${endPeriod}`;
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
      {/* Filter and Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-40 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Hour Window</TableHead>
              {showBranchColumn && <TableHead>Branch</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Checklist Items</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Completed At</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showBranchColumn ? 7 : 6}
                  className="h-28 text-center text-muted-foreground"
                >
                  No maintenance records found for this date.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const branchName =
                  typeof log.locationId === "object" && log.locationId !== null
                    ? log.locationId.branchName
                    : "Assigned Branch";

                const isComplete = log.overallStatus === "completed";
                const completedCount = log.items.filter(
                  (i) => i.isCompleted
                ).length;

                return (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatHourRange(log.slotHour)}
                    </TableCell>

                    {showBranchColumn && (
                      <TableCell className="whitespace-nowrap font-medium">
                        {branchName}
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge
                        className={
                          isComplete
                            ? "bg-emerald-600 text-white hover:bg-emerald-600"
                            : completedCount > 0
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-100"
                        }
                      >
                        {isComplete
                          ? "Completed (4/4)"
                          : completedCount > 0
                          ? `Partial (${completedCount}/4)`
                          : "Missed"}
                      </Badge>
                    </TableCell>

                    {/* 4 item icons */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.items.map((item) => {
                          const Icon = ITEM_ICONS[item.id];
                          return (
                            <span
                              key={item.id}
                              title={`${item.title}: ${
                                item.isCompleted ? "Completed" : "Incomplete"
                              }${item.notes ? ` (${item.notes})` : ""}`}
                              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                                item.isCompleted
                                  ? "bg-emerald-500/15 text-emerald-600"
                                  : "bg-muted text-muted-foreground/40"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.lastUpdatedByName || "–"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {log.completedAt ? (
                        new Date(log.completedAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      ) : (
                        <span>–</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {log.notes ||
                        log.items
                          .filter((i) => i.notes)
                          .map((i) => `${i.title}: ${i.notes}`)
                          .join(", ") ||
                        "–"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
