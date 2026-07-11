"use client";

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../button";
import { Check, Loader2 } from "lucide-react";
import { acceptMemberAction } from "@/lib/actions/member-actions";
import { useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/core/api-error";

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

function AcceptMemberButton({ uid, name }: { uid: string; name: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddMember = async () => {
    setIsProcessing(true);
    try {
      const result = await acceptMemberAction(uid);
      if (result.success) {
        toast.success(`${name} was accepted as a member.`);
        window.location.reload();
        return;
      }

      const message =
        result.errors instanceof ApiError
          ? result.errors.message
          : result.errors?.message || "Failed to accept member request.";
      toast.error(message);
    } catch {
      toast.error("Failed to accept member request.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      size="sm"
      disabled={isProcessing}
      className="flex items-center gap-1.5 text-green-800 bg-transparent border border-green-800 rounded-md px-2 py-1 hover:bg-green-800 hover:text-white w-full sm:w-auto"
      onClick={handleAddMember}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {isProcessing ? "Accepting..." : "Add Member"}
      </span>
      <span className="sm:hidden">
        {isProcessing ? "..." : "Add"}
      </span>
    </Button>
  );
}

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
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <AcceptMemberButton uid={row.original.id} name={row.original.name} />
      </div>
    ),
  },
];
