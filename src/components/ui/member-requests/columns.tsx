import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../button";
import { Check } from "lucide-react";
import { addMember } from "@/lib/data/users";

export type PendingPackage = {
  pkgName: string;
  remainingClasses: number;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  pendingPackages: PendingPackage[];
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "pendingPackages",
    header: "Assigned Packages",
    cell: ({ row }) => {
      const packages = row.original.pendingPackages;
      if (!packages?.length) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {packages.map((pkg, index) => (
            <span key={index} className="text-sm">
              {pkg.pkgName} ({pkg.remainingClasses} left)
            </span>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const handleAddMember = async (uid: string) => {
        await addMember(uid);
        window.location.reload();
      };
      return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            className="flex items-center gap-1.5 text-green-800 bg-transparent border border-green-800 rounded-md px-2 py-1 hover:bg-green-800 hover:text-white w-full sm:w-auto"
            onClick={() => handleAddMember(row.original.id)}
          >
            <Check className="h-4 w-4"/>
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      );
    },
  },
];
