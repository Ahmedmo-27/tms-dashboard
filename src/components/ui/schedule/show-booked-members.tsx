"use client";
import { useEffect, useState } from "react";
import { Button } from "../button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../tooltip";
import { Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../dialog";
import { BookedMembersContainer } from "./booked-members-container";

export type Member = {
  name: string;
  phone: string;
  uid: string;
  _id: string;
  bookingId: string;
  attended?: boolean;
};

export type MemberListEntry = {
  name: string;
  phone?: string;
  uid?: string;
  bookingId?: string;
  cancelled?: boolean;
  attended?: boolean;
  paid?: boolean;
}

export function ShowBookedMembers({ members, scid }: { members: Member[], scid: string }) {
  const [memberNames, setMemberNames] = useState<MemberListEntry[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const names: MemberListEntry[] = [];
    members.forEach((member) => {
      names.push({name: member.name, phone: member.phone, uid: member.uid, bookingId: member.bookingId, attended: member.attended});
    });
    setMemberNames(names);
  }, [members, setMemberNames]);
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <Users className="h-4 w-4" />
              <span className="sr-only">Show booked members</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Show booked members</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="pt-4">
            <BookedMembersContainer members={memberNames} scid={scid} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
