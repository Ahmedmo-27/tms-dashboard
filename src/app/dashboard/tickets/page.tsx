"use client";

import TicketsContainer from "@/components/ui/tickets/tickets-container";
import { Separator } from "@/components/ui/separator";
import { Ticket } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">
              Problems reported by users from the app
            </p>
          </div>
        </div>
      </div>

      <Separator className="hidden sm:block" />

      <div className="flex-1">
        <TicketsContainer />
      </div>
    </div>
  );
}
