import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ShowBookedMembers } from "./show-booked-members";
import { Member } from "./show-booked-members";
import { ShowWaitlist } from "./show-waitlist";
import { format } from "date-fns";
import CancelClassDialog from "../dialogs/schedule/cancel-class";
import EditSlotsDialog from "../dialogs/schedule/edit-slots";
import { EditClassComponent } from "../dialogs/schedule/edit-class";
import { BookNonUserDialog } from "../dialogs/schedule/book-non-user";
import { AddToWaitlistDialog } from "../dialogs/schedule/add-to-waitlist-dialog";

export interface AttendanceConfirmation {
  confirmed: boolean;
  confirmedCount: number;
  hasMissingPlace: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  notes?: string;
}

export type WaitlistMember = {
  _id?: string;
  uid: string;
  name: string;
  phone?: string;
  status?: string;
  position?: number;
  addedAt?: string;
  isManual?: boolean;
  reservationExpiresAt?: string;
  notifiedAt?: string;
  hasEligiblePackage?: boolean;
};

export type ScheduledClass = {
  _id?: string;
  cid: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  bookedMembers: Member[];
  waitlist?: WaitlistMember[];
  coachName: string;
  coachId?: string | string[];
  category?: string;
  className?: string;
  classPrice?: string;
  location?: string;
  locationId?: string;
  scans: any;
  attendanceConfirmation?: AttendanceConfirmation;
};

function ScheduledClassActionsCell({
  scls,
  coaches,
}: {
  scls: ScheduledClass;
  coaches: any[];
}) {
  const [activeModal, setActiveModal] = useState<
    "book" | "waitlist" | "slots" | "edit" | "cancel" | null
  >(null);

  return (
    <div className="flex justify-center">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Editing {scls.className}</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => setActiveModal("book")}
            className="cursor-pointer"
          >
            Book Class
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setActiveModal("waitlist")}
            className="cursor-pointer"
          >
            Add to Waitlist
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setActiveModal("slots")}
            className="cursor-pointer"
          >
            Change remaining slots
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setActiveModal("edit")}
            className="cursor-pointer"
          >
            Edit Class
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setActiveModal("cancel")}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            Cancel Class
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeModal === "book" && (
        <BookNonUserDialog
          scid={scls._id as string}
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModal(null);
          }}
        />
      )}
      {activeModal === "waitlist" && (
        <AddToWaitlistDialog
          scheduledClass={scls}
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModal(null);
          }}
        />
      )}
      {activeModal === "slots" && (
        <EditSlotsDialog
          scheduledClass={scls}
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModal(null);
          }}
        />
      )}
      {activeModal === "edit" && (
        <EditClassComponent
          scheduledClass={scls}
          coaches={coaches}
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModal(null);
          }}
        />
      )}
      {activeModal === "cancel" && (
        <CancelClassDialog
          scls={scls}
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}

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
          {Math.max(0, scls.availableSlots ?? 0)}
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
    size: 90,
    minSize: 60,
    maxSize: 120,
    cell: ({ row }) => {
      const scls = row.original;
      const waitlist = scls.waitlist ?? [];
      const hasWaitlist = waitlist.length > 0;
      return (
        <div className="flex items-center justify-center gap-1">
          <ShowBookedMembers
            members={scls.bookedMembers as Member[]}
            scid={scls._id ?? ""}
          />
          {hasWaitlist && (
            <ShowWaitlist waitlist={waitlist} scid={scls._id ?? ""} />
          )}
        </div>
      );
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
      return <ScheduledClassActionsCell scls={scls} coaches={coaches} />;
    },
  },
];
