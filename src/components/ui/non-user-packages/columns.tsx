import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../button";
import { Check } from "lucide-react";
import { addMember } from "@/lib/data/users";

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.phone;
      const [copied, setCopied] = React.useState(false);

      const handleCopy = () => {
        navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      };

      return (
        <button
          onClick={handleCopy}
          className="text-blue-600 underline hover:text-blue-800 transition"
        >
          {copied ? "Copied!" : phone}
        </button>
      );
    },
  },

  {
    accessorKey: "pkgName",
    header: "Package",
  },
  {
    accessorKey: "remainingClasses",
    header: "Remaining Classes",
  },
  // {
  //   id: "actions",
  //   header: "Action",
  //   cell: ({ row }) => {
  //     const handleAddMember = async (uid: string) => {
  //       await addMember(uid);
  //       window.location.reload();
  //     };
  //     return (
  //       <div className="flex space-x-2">
  //         <Button
  //           size="sm"
  //           className="flex items-center gap-1.5 text-green-800 bg-transparent border border-green-800 rounded-md px-2 py-1 hover:bg-green-800 hover:text-white w-full sm:w-auto"
  //           onClick={() => handleAddMember(row.original.id)}
  //         >
  //           <Check className="h-4 w-4" />
  //           <span className="hidden sm:inline">Add Member</span>
  //           <span className="sm:hidden">Add</span>
  //         </Button>
  //       </div>
  //     );
  //   },
  // },
];
