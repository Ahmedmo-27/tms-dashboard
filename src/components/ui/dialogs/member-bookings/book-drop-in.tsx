"use client";

import { OpenGymDropInDialog } from "@/components/ui/dialogs/open-gym/open-gym-drop-in-dialog";

export default function BookDropIn({
  uid,
  memberName,
}: {
  uid: string;
  memberName?: string;
}) {
  return (
    <OpenGymDropInDialog
      uid={uid}
      memberName={memberName}
      triggerLabel="Open gym drop-in"
    />
  );
}
