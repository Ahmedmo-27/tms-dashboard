"use client";

import { useEffect, useState } from "react";
import { Button } from "../button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../tooltip";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { WaitlistMember } from "./columns";
import { WaitlistContainer } from "./waitlist-container";

export function ShowWaitlist({
  waitlist,
  scid,
}: {
  waitlist: WaitlistMember[];
  scid: string;
}) {
  const [currentWaitlist, setCurrentWaitlist] = useState<WaitlistMember[]>(waitlist);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrentWaitlist(waitlist);
  }, [waitlist]);

  if (!open && (!currentWaitlist || currentWaitlist.length === 0)) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 cursor-pointer relative text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
            onClick={() => setOpen(true)}
            aria-label="View waitlist"
          >
            <Clock className="h-4 w-4" />
            <span className="sr-only">View waitlist</span>
            {currentWaitlist.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {currentWaitlist.length}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>View waitlist ({currentWaitlist.length})</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waiting List</DialogTitle>
            <DialogDescription className="sr-only">
              List of waitlisted members for this class
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <WaitlistContainer
              waitlist={currentWaitlist}
              scid={scid}
              onWaitlistChange={setCurrentWaitlist}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
