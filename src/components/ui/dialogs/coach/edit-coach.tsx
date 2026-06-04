"use client";
import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { editCoachAction } from "@/lib/actions/coach-actions";
import { Coach } from "../../coaches/columns";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null;
  data: any | null;
}

export default function EditCoachDialog({ coach }: { coach: Coach }) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState: ActionState = { success: false, errors: null, data: null };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await editCoachAction(currentState, formData);
      if (result.success) {
        setIsOpen(false);
        return initialState;
      }
      return result;
    },
    initialState
  );

  return (
    <div>
      <Button
        variant="outline"
        className="cursor-pointer w-full"
        onClick={() => setIsOpen(true)}
      >
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Editing {coach.coachName}
            </DialogTitle>
            <DialogDescription>Update the coach's details</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="mt-4 space-y-6">
            <input type="hidden" name="_id" value={coach._id} />

            <div className="space-y-2">
              <Label htmlFor="coachName" className="text-sm font-medium">
                Coach Name
              </Label>
              <Input
                id="coachName"
                name="coachName"
                type="text"
                defaultValue={coach.coachName}
              />
              {state?.errors && "coachName" in state.errors && (
                <p className="text-destructive text-sm">
                  {state.errors.coachName}
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
                type="text"
                defaultValue={coach.phoneNumber}
              />
              {state?.errors && "phoneNumber" in state.errors && (
                <p className="text-destructive text-sm">
                  {state.errors.phoneNumber}
                </p>
              )}
            </div>

            {state?.errors?.message && (
              <p className="text-destructive text-sm">{state.errors.message}</p>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={pending}
              >
                {pending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
