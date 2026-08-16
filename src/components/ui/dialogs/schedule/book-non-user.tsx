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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { bookNonUserAction } from "@/lib/actions/booking-actions";
import { ArrowBigRight } from "lucide-react";

interface ActionState {
  success: boolean;
  errors: Record<string, string | boolean> | null | ApiError;
  data: any | null;
  usrId?: string;
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
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      setIsLoading(true);

      const defaultValues = {
        name: formData.get("name") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        scid: formData.get("scid") as string,
      };

      const result = await bookNonUserAction(currentState, formData);

      if (result.success) {
        setIsLoading(false);
        setIsOpen(false);
        return initialState;
      }
      if (
        result?.errors &&
        typeof result.errors === "object" &&
        "message" in result.errors &&
        String((result.errors as { message?: string }).message ?? "").length ===
          24
      ) {
        setIsLoading(false);
        return {
          ...currentState,
          errors: { userExists: true },
          usrId: (result.errors as { message?: string }).message,
          defaultValues,
        };
      }
      setIsLoading(false);
      return { ...result, defaultValues };
    },
    initialState
  );

  const fieldErrors =
    state.errors &&
    typeof state.errors === "object" &&
    !(state.errors instanceof ApiError)
      ? (state.errors as Record<string, string | boolean>)
      : null;

  const navigateToUser = () => {
    if (state.usrId) {
      window.open(`/dashboard/our-members/${state.usrId}`, "_blank");
    }
  };

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
                {fieldErrors?.name && (
                  <p className="text-destructive text-xs">
                    {String(fieldErrors.name)}
                  </p>
                )}
              </div>

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
                {fieldErrors?.phoneNumber && (
                  <p className="text-destructive text-xs">
                    {String(fieldErrors.phoneNumber)}
                  </p>
                )}
              </div>
            </div>

            {fieldErrors?.userExists && (
              <div className="flex items-center justify-between rounded-md border border-destructive p-3">
                <p className="text-destructive text-sm font-medium">
                  User already exists — open their profile
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={navigateToUser}
                >
                  <ArrowBigRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {typeof fieldErrors?.message === "string" && fieldErrors.message && (
              <p className="text-destructive text-sm">{fieldErrors.message}</p>
            )}

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
