import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ShowBookedMembers } from "./show-booked-members";
import { Member } from "./show-booked-members";
import { format } from "date-fns";
import CancelClassDialog from "../dialogs/schedule/cancel-class";
import EditSlotsDialog from "../dialogs/schedule/edit-slots";
import { EditClassComponent } from "../dialogs/schedule/edit-class";
import { BookNonUserDialog } from "../dialogs/schedule/book-non-user";

export type ScheduledClass = {
  _id?: string;
  cid: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  bookedMembers: Member[];
  coachName: string;
  coachId?: string | string[];
  category?: string;
  className?: string;
  location?: string;
  scans: any;
};

export const getColumns = (
  coaches: any
): ColumnDef<ScheduledClass>[] => [
  {
    accessorKey: "className",
    header: "Class",
    size: 120,
    minSize: 80,
    maxSize: 200,
  },
  {
    accessorKey: "availableSlots",
    header: "Slots",
    size: 60,
    minSize: 50,
    maxSize: 80,
    cell: ({ row }) => {
      const scls = row.original;
      return (
        <div className="text-center font-medium">
          {scls.availableSlots}
        </div>
      );
    },
  },
  {
    accessorKey: "startTime",
    header: "Start",
    size: 80,
    minSize: 70,
    maxSize: 100,
    cell: ({ row }) => {
      const scls = row.original;
      return (
        <div className="text-center text-sm">
          {format(scls.startTime, "HH:mm")}
        </div>
      );
    },
  },
  {
    accessorKey: "endTime",
    header: "End",
    size: 80,
    minSize: 70,
    maxSize: 100,
    cell: ({ row }) => {
      const scls = row.original;
      return (
        <div className="text-center text-sm">
          {format(scls.endTime, "HH:mm")}
        </div>
      );
    },
  },
  {
    accessorKey: "coachName",
    header: "Coach",
    size: 100,
    minSize: 80,
    maxSize: 150,
    cell: ({ row }) => {
      const scls = row.original;
      return (
        <div className="truncate text-sm" title={scls.coachName}>
          {scls.coachName}
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    size: 90,
    minSize: 70,
    maxSize: 120,
    cell: ({ row }) => {
      const scls = row.original;
      return (
        <div className="truncate text-sm" title={scls.location}>
          {scls.location}
        </div>
      );
    },
  },
  {
    id: "showBooked",
    header: "Booked",
    size: 80,
    minSize: 60,
    maxSize: 100,
    cell: ({ row }) => {
      const scls = row.original;
      return <ShowBookedMembers members={scls.bookedMembers as Member[]} scid={scls._id} />;
    },
  },
  {
    id: "actions",
    header: "",
    size: 50,
    minSize: 40,
    maxSize: 60,
    cell: ({ row }) => {
      const scls = row.original;
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Editing {scls.className}</DropdownMenuLabel>
              <BookNonUserDialog scid={scls._id as string} />
              <EditSlotsDialog scheduledClass={scls} />
              <EditClassComponent scheduledClass={scls} coaches={coaches} />
              <CancelClassDialog scls={scls} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
