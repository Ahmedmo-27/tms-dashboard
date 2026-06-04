"use client";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useActionState } from "react";
import { changePkgEndDate } from "@/lib/actions/member-actions";

export default function ExtendPackage({
  pkg,
  uid
}: {
  pkg: { [x: string]: string | number | readonly string[] | undefined, name: string; pkgEndDate: string; id: string };
  uid: string;
}) {
  const [date, setDate] = useState(pkg.pkgEndDate);
  const [open, setOpen] = useState(false);

  const initialState = {
    success: false,
    errors: null,
    data: null,
  };

  const [state, formAction] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await changePkgEndDate(currentState, formData);
      if (result.success) {
        setOpen(false);
        return initialState;
      }
      return result;
    },
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer"
        >
          Change package end date
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Package</DialogTitle>
          <DialogDescription>Select the new expiry date.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="uid" value={uid} />
          <input type="hidden" name="pkgId" value={pkg._id} />
          <input type="hidden" name="pkgStartDate" value={pkg.pkgStartDate} />
          <input type="hidden" name="date" value={date} />
          <div className="relative cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <DatePicker
              date={new Date(date)}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate.toISOString());
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline"
              className="cursor-pointer" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="cursor-pointer"
              disabled={state.success}
            >
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
