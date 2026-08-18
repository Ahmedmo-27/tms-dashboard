import { ColumnDef } from "@tanstack/react-table";
import EditCoachDialog from "../dialogs/coach/edit-coach";
import {
  formatDisplayPhone,
  telHref,
  whatsAppHref,
} from "@/lib/utils/phone";
import { Button } from "../button";
import { MessageCircle } from "lucide-react";

export type Coach = {
  _id: string;
  coachName: string;
  phoneNumber: string;
};

export function createColumns(): ColumnDef<Coach>[] {
  return [
    {
      accessorKey: "coachName",
      header: "Name",
      size: 200,
      cell: ({ row }) => (
        <p className="font-medium truncate max-w-[180px] xl:max-w-[240px]">
          {row.original.coachName}
        </p>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      size: 160,
      cell: ({ row }) => {
        const phone = row.original.phoneNumber;
        const telLink = telHref(phone);

        return telLink ? (
          <a
            href={telLink}
            className="tabular-nums whitespace-nowrap hover:underline text-foreground"
          >
            {formatDisplayPhone(phone)}
          </a>
        ) : (
          <span className="text-muted-foreground tabular-nums">
            {formatDisplayPhone(phone)}
          </span>
        );
      },
    },
    {
      id: "contact",
      header: () => <span className="sr-only">Contact</span>,
      size: 48,
      cell: ({ row }) => {
        const waLink = whatsAppHref(row.original.phoneNumber);
        if (!waLink) return null;

        return (
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              <span className="sr-only">WhatsApp</span>
            </a>
          </Button>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 72,
      cell: ({ row }) => <EditCoachDialog coach={row.original} compact />,
    },
  ];
}
