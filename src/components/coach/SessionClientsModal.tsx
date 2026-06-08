"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionDto, CalendarClientDto } from "@/types/coach.types";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 5;

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
  const [page, setPage] = useState(1);

  // Reset page whenever the session changes
  useEffect(() => {
    setPage(1);
  }, [session?.scheduledClassId]);

  if (!session) return null;

  const clients = session.clients;
  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginated = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            &nbsp;&bull;&nbsp;
            {session.bookedCount} / {session.capacity} booked
          </DialogDescription>
        </DialogHeader>

        {/* Client count header */}
        {clients.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-b pb-2">
            <Users className="h-3.5 w-3.5" />
            <span>
              {clients.length} client{clients.length !== 1 ? "s" : ""}
              {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
            </span>
          </div>
        )}

        {/* Client list */}
        <div className="flex flex-col gap-2">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">No bookings yet</p>
            </div>
          ) : (
            paginated.map((client: CalendarClientDto, index: number) => (
              <div
                key={client.memberId}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                {/* Numbered avatar */}
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm select-none">
                  {client.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{client.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      #{(page - 1) * PAGE_SIZE + index + 1}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {client.phoneNumber}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
