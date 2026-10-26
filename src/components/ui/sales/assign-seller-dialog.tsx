"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignSoldPackageSeller } from "@/lib/data/sales";
import type { SalesAccount, SoldPackage } from "@/types/sales";
import { toast } from "react-hot-toast";
import { HandCoins, Loader2 } from "lucide-react";
import { format } from "date-fns";

const UNASSIGNED = "__unassigned__";

interface AssignSellerDialogProps {
  soldPackage: SoldPackage | null;
  accounts: SalesAccount[];
  accountsLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function AssignSellerDialog({
  soldPackage,
  accounts,
  accountsLoading,
  open,
  onOpenChange,
  onAssigned,
}: AssignSellerDialogProps) {
  const [selected, setSelected] = useState<string>(UNASSIGNED);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelected(soldPackage?.soldBy?._id ?? UNASSIGNED);
  }, [soldPackage]);

  if (!soldPackage) return null;

  const current = soldPackage.soldBy?._id ?? UNASSIGNED;
  const unchanged = selected === current;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await assignSoldPackageSeller(
        soldPackage.memberPackageId,
        selected === UNASSIGNED ? null : selected
      );
      toast.success(
        selected === UNASSIGNED
          ? "Sales attribution cleared"
          : `Credited to ${
              accounts.find((a) => a._id === selected)?.name ?? "sales account"
            }`
      );
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save the sales attribution"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Who sold this package?
          </DialogTitle>
          <DialogDescription>
            Credit this sale to the sales account that sold it to the member.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
          <p className="font-medium">{soldPackage.packageName}</p>
          <p className="text-muted-foreground">
            {soldPackage.memberName}
            {soldPackage.memberPhone ? ` · ${soldPackage.memberPhone}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Started{" "}
            {soldPackage.pkgStartDate
              ? format(new Date(soldPackage.pkgStartDate), "dd MMM yyyy")
              : "—"}
            {soldPackage.branchName ? ` · ${soldPackage.branchName}` : ""}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sales account</Label>
          <Select
            value={selected}
            onValueChange={setSelected}
            disabled={isSubmitting || accountsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  accountsLoading ? "Loading accounts..." : "Select a salesperson"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>No salesperson</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account._id} value={account._id}>
                  {account.name}
                  {account.role === "sales_manager" ? " (Sales Manager)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!accountsLoading && accounts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sales accounts exist yet. Management can create them on the
              Accounts page with the Sales role.
            </p>
          )}
          {soldPackage.soldByAssignedBy && soldPackage.soldByAssignedAt && (
            <p className="text-xs text-muted-foreground">
              Last set by {soldPackage.soldByAssignedBy.name} on{" "}
              {format(new Date(soldPackage.soldByAssignedAt), "dd MMM yyyy")}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting || unchanged}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
