import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../badge";
import { Avatar, AvatarFallback } from "../avatar";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Phone,
  MapPin,
} from "lucide-react";
import { OutflowPurposeCell } from "./outflow-details-dialog";

export type Payment = {
  memberName: string;
  phone: string;
  purpose: string;
  paymentTime: Date;
  amount: string;
  paymentMethod: string;
  location: string;
  classTime: string;
  isRefunded?: boolean;
  isCashOut?: boolean;
  refundReason?: string;
  paymentLabel?: string | null;
};

const getPaymentMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case "CASH":
      return <Banknote className="h-4 w-4" />;
    case "INSTAPAY":
    case "APP":
      return <Smartphone className="h-4 w-4" />;
    case "VALU":
      return <Building2 className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

const getPaymentMethodColor = (method: string) => {
  switch (method.toLowerCase()) {
    case "CASH":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "INSTAPAY":
    case "APP":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "VALU":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "memberName",
    header: "Member",
    enableSorting: true,
    cell: ({ row }) => {
      const name = (row.getValue("memberName") as string | undefined) ?? "—";
      const phone = (row.getValue("phone") as string | undefined) ?? "—";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      return (
        <div className="flex items-center gap-3 min-w-[180px] max-w-[250px]">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-medium truncate">{name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{phone}</span>
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    meta: {
      className: "hidden"
    }
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    enableSorting: true,
    cell: ({ row }) => <OutflowPurposeCell payment={row.original} />,
  },
  {
    accessorKey: "paymentTime",
    header: "Date & Time",
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue("paymentTime") as Date;
      const timeZone = "Africa/Cairo";
      return (
        <div className="flex flex-col min-w-[100px] max-w-[140px]">
          <span className="font-medium text-sm">
            {formatInTimeZone(new Date(date), timeZone, "MMM dd, yyyy")}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatInTimeZone(new Date(date), timeZone, "hh:mm a")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    enableSorting: true,
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      const isOutflow = row.original.isRefunded || row.original.isCashOut;

      let numericAmount = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^0-9.-]+/g, ""))
        : parseFloat(String(amount));

      return (
        <div className={`font-mono font-semibold min-w-[80px] max-w-[120px] text-right ${isOutflow ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {isOutflow ? "-" : ""}EGP {numericAmount.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
    enableSorting: true,
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as string;

      return (
        <div className="max-w-[100px]">
          <Badge
            variant="secondary"
            className={`flex items-center gap-1.5 w-fit text-xs ${getPaymentMethodColor(
              method
            )}`}
          >
            {getPaymentMethodIcon(method)}
            <span className="truncate">{method}</span>
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1.5 max-w-[120px]">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <div className="truncate text-sm">{row.getValue("location")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "classTime",
    header: "Class Time",
    cell: ({ row }) => {
      if (row.getValue("classTime") === null) return <span className="text-muted-foreground">--</span>;
      const date = row.getValue("classTime") as Date;
      const timeZone = "Africa/Cairo";
      return (
        <div className="flex flex-col min-w-[100px] max-w-[140px]">
          <span className="font-medium text-sm">
            {formatInTimeZone(new Date(date), timeZone, "MMM dd, yyyy")}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatInTimeZone(new Date(date), timeZone, "hh:mm a")}
          </span>
        </div>
      );
    },
  },
];
