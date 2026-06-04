"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/core/api-error";
import { redirect, useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { bookNonUserAction } from "@/lib/actions/booking-actions";
import { ArrowBigRight } from "lucide-react";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    name: string;
    phoneNumber: string;
    scid: string;
  };
}

export function BookNonUserDialog({ scid }: { scid: string }) {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: { name: "", phoneNumber: "", scid: "" },
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Partial<Error> | null>(null);
  const [usrId, setUsrId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const navigateToUser = () => {
    console.log("CLICKED");
    if (usrId) {
      window.open(`/dashboard/our-members/${usrId}`, "_blank");
    }
  };
  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      setIsLoading(true);
      setError(null);

      const defaultValues = {
        name: formData.get("name") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        scid: formData.get("scid") as string,
      };

      const result = await bookNonUserAction(currentState, formData);

      if (result.success) {
        setIsOpen(false);
        return initialState;
      }
      if (result?.errors?.message?.length == 24) {
        return {
          ...currentState,
          errors: { userExists: true },
          usrId: result.errors.message,
          defaultValues,
        };
      }
      setIsLoading(false);
      console.log(error);
      return { ...result, defaultValues };
    },
    initialState
  );

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() => setIsOpen(true)}
          className="cursor-pointer"
        >
          Book Class
        </DropdownMenuItem>

        <DialogContent className="z-50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Book for a Guest User
            </DialogTitle>
            <DialogDescription>
              Enter guest details to reserve a spot in this class.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="mt-4 space-y-6">
            <input type="hidden" name="scid" value={scid} />

            <div className="grid grid-cols-1 gap-5">
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Abdelrahman Tolan"
                />
                {error &&
                  typeof error === "object" &&
                  !(error instanceof ApiError) &&
                  "name" in error && (
                    <p className="text-destructive text-xs">
                      {(error as any).name}
                    </p>
                  )}
              </div>

              {/* Phone field */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+20 123 456 7890"
                />
                {error &&
                  typeof error === "object" &&
                  !(error as any).context &&
                  "phoneNumber" in error && (
                    <p className="text-destructive text-xs">
                      {(error as any).phoneNumber}
                    </p>
                  )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="px-4"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4"
                disabled={pending || isLoading}
              >
                {pending || isLoading ? "Saving..." : "Save Booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
