"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { editMemberAction } from "@/lib/actions/member-actions";

interface EditMemberDialogProps {
  member: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    nationalId?: string;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditMemberDialog({
  member,
  trigger,
  open,
  onOpenChange,
}: EditMemberDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const router = useRouter();

  const [name, setName] = useState(member.name || "");
  const [phoneNumber, setPhoneNumber] = useState(member.phone || "");
  const [email, setEmail] = useState(
    member.email && !member.email.endsWith("@devdefault.com") ? member.email : ""
  );
  const [nationalId, setNationalId] = useState(member.nationalId || "");

  useEffect(() => {
    if (isOpen) {
      setName(member.name || "");
      setPhoneNumber(member.phone || "");
      setEmail(
        member.email && !member.email.endsWith("@devdefault.com") ? member.email : ""
      );
      setNationalId(member.nationalId || "");
    }
  }, [isOpen, member]);

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await editMemberAction(currentState, formData);
      if (result.success) {
        toast.success("Member updated successfully");
        setIsOpen(false);
        router.refresh();
      }
      return result;
    },
    { success: false, errors: null, data: null }
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="min-h-[40px] px-3 gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Member</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="z-50 w-[95vw] max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Edit Member Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update member personal data and national ID number.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="uid" value={member.id} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-member-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="edit-member-name"
                name="name"
                type="text"
                className="w-full min-h-[40px]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {state?.errors &&
                typeof state.errors === "object" &&
                "name" in state.errors && (
                  <p className="text-destructive text-xs">
                    {(state.errors as Record<string, string>).name}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-member-phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="edit-member-phone"
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                className="w-full min-h-[40px]"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              {state?.errors &&
                typeof state.errors === "object" &&
                "phoneNumber" in state.errors && (
                  <p className="text-destructive text-xs">
                    {(state.errors as Record<string, string>).phoneNumber}
                  </p>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-member-national-id" className="text-sm font-medium">
              National ID Number
            </Label>
            <Input
              id="edit-member-national-id"
              name="nationalId"
              type="text"
              placeholder="e.g. 29901011234567"
              className="w-full min-h-[40px]"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
            />
            {state?.errors &&
              typeof state.errors === "object" &&
              "nationalId" in state.errors && (
                <p className="text-destructive text-xs">
                  {(state.errors as Record<string, string>).nationalId}
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-member-email" className="text-sm font-medium">
              Email <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
            </Label>
            <Input
              id="edit-member-email"
              name="email"
              type="email"
              placeholder="member@example.com"
              className="w-full min-h-[40px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {state?.errors &&
              typeof state.errors === "object" &&
              "email" in state.errors && (
                <p className="text-destructive text-xs">
                  {(state.errors as Record<string, string>).email}
                </p>
              )}
          </div>

          {state?.errors &&
            typeof state.errors === "object" &&
            "message" in state.errors &&
            (state.errors as { message?: string }).message && (
              <p className="text-destructive text-xs sm:text-sm font-medium">
                {(state.errors as { message?: string }).message}
              </p>
            )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={pending}
              className="min-h-[40px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="min-h-[40px]">
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
