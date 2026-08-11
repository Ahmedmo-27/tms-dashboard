import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export type AdjustmentRecord = {
  date: string;
  reason?: string;
  attendanceDate?: string;
  className?: string;
  amount: number;
  type: "ADD" | "DEDUCT";
  source:
    | "BOOKING"
    | "PT_ATTENDANCE"
    | "ADMIN"
    | "MEMBER_CANCELLATION"
    | "FRONTDESK_CANCELLATION";
};

export type MemberPackage = {
  _id: string;
  name: string;
  pkgStartDate: string;
  pkgEndDate: string;
  status: string;
  remainingClasses: number;
  adjustmentHistory: AdjustmentRecord[];
  attendance: { className: string; attendanceDate: string }[];
};

export type Booking = {
  id: string;
  scid: string;
  className: string;
  bookingTime: Date;
  classTime: Date;
}

export type Member = {
  id: string;
  name: string;
  phone: string;
  email: string;
  activePkgs: number;
  packages: MemberPackage[];
  bookings: Booking[];
  ptAttendance: any[];
};

function soonestActiveExpiry(packages: MemberPackage[]): Date | null {
  const times = (packages ?? [])
    .filter((pkg) => pkg.status?.toUpperCase() === "ACTIVE" && pkg.pkgEndDate)
    .map((pkg) => new Date(pkg.pkgEndDate).getTime())
    .filter((time) => !Number.isNaN(time));
  if (times.length === 0) return null;
  return new Date(Math.min(...times));
}

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="font-medium truncate max-w-[150px] sm:max-w-none">
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return (
        <div className="font-mono text-sm truncate max-w-[120px] sm:max-w-none">
          {phone}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return (
        <div className="text-sm truncate max-w-[150px] sm:max-w-none text-muted-foreground">
          {email || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "activePkgs",
    header: "Status",
    cell: ({ row }) => {
      const activePkgs = row.getValue("activePkgs") as number;
      const expiry = soonestActiveExpiry(row.original.packages);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {activePkgs} active
          </span>
          <span className="text-xs text-muted-foreground">
            {expiry ? `Expires ${format(expiry, "dd MMM yyyy")}` : "No active expiry"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <div onClick={(event) => event.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 touch-manipulation">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="truncate">Helping {member.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(member.phone)}
            >
              Copy phone number
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/dashboard/our-members/${member.id}`}>
                View member data
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      );
    },
  },
];
