"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SessionDto, CalendarClientDto } from "@/types/coach.types";
import { Users } from "lucide-react";
import { telHref } from "@/lib/utils/phone";

interface SessionClientsModalProps {
  session: SessionDto | null;
  onClose: () => void;
}

function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export function SessionClientsModal({
  session,
  onClose,
}: SessionClientsModalProps) {
  if (!session) return null;

  const clients = session.clients;

  return (
    <Dialog open={!!session} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{session.classTitle}</span>
            <Badge variant="secondary" className="text-[10px]">
              {session.category}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)}
            {session.location ? ` · ${session.location}` : ""}
            &nbsp;•&nbsp;
            {session.bookedCount} / {session.capacity} booked
          </DialogDescription>
        </DialogHeader>

        {clients.length > 0 && (
          <div className="flex items-center gap-2 border-b pb-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>
              {clients.length} client{clients.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <ScrollArea className="max-h-[60vh]">
          <div className="flex flex-col gap-2 pr-3">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              clients.map((client: CalendarClientDto) => {
                const tel = telHref(client.phoneNumber);
                return (
                  <div
                    key={client.memberId}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{client.name}</p>
                      {tel ? (
                        <a href={tel} className="text-xs text-muted-foreground hover:underline">
                          {client.phoneNumber}
                        </a>
                      ) : (
                        <p className="truncate text-xs text-muted-foreground">
                          {client.phoneNumber}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {client.bookingMethod}
                        {client.activePackage
                          ? ` · ${client.activePackage.remainingClasses} left`
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
