import { ColumnDef } from "@tanstack/react-table";
import EditCoachDialog from "../dialogs/coach/edit-coach";

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
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
    },
    {
      id: "actions",
      cell: ({ row }) => <EditCoachDialog coach={row.original} />,
    },
  ];
}
