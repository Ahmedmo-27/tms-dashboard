"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SessionDto, CalendarClientDto } from "@/types/coach.types";
import { ChevronRight, Users, UserCheck, UserPlus, Edit3 } from "lucide-react";
import { telHref } from "@/lib/utils/phone";
import { useState } from "react";
import { ShadowCoachChecklistModal } from "@/components/coach/ShadowCoachChecklistModal";
import { AssignShadowCoachDialog } from "@/components/coach/AssignShadowCoachDialog";
import { useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store/store";
import { canManageShadowCoaches } from "@/lib/config/roles";
import Link from "next/link";

interface SessionClientsModalProps {
  session: SessionDto | null;
  onClose: () => void;
  onUpdated?: () => void;
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
  onUpdated,
}: SessionClientsModalProps) {
  const coachRole = useAppSelector((state: RootState) => state.coach?.role);
  const authRole = useAppSelector((state: RootState) => state.auth?.user?.role);
  const isManager = canManageShadowCoaches(coachRole) || canManageShadowCoaches(authRole);

  const [shadowChecklistOpen, setShadowChecklistOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  if (!session) return null;

  const clients = session.clients;

  return (
    <>
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

          {session.shadowCoach ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {session.shadowCoach.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {session.shadowCoach.phaseLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs shrink-0 cursor-pointer"
                  onClick={() => setShadowChecklistOpen(true)}
                >
                  Checklist
                </Button>
                {isManager && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0 cursor-pointer"
                    onClick={() => setAssignDialogOpen(true)}
                    title="Change shadow coach assignment"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Change
                  </Button>
                )}
              </div>
            </div>
          ) : isManager ? (
            <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/30 bg-muted/20 p-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-4 w-4 text-primary" />
                <span>No shadow coach assigned</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setAssignDialogOpen(true)}
              >
                Assign Shadow
              </Button>
            </div>
          ) : null}

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
                clients.map((client: CalendarClientDto, idx: number) => {
                  const tel = telHref(client.phoneNumber);
                  return (
                    <div
                      key={client.memberId || `${client.name}-${idx}`}
                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        {client.memberId ? (
                          <Link
                            href={`/coach/clients/${client.memberId}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 truncate text-sm font-medium hover:underline"
                          >
                            <span className="truncate">{client.name}</span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium">{client.name}</p>
                        )}
                        <div>
                          {tel ? (
                            <a href={tel} className="text-xs text-muted-foreground hover:underline">
                              {client.phoneNumber}
                            </a>
                          ) : (
                            <p className="truncate text-xs text-muted-foreground">
                              {client.phoneNumber}
                            </p>
                          )}
                        </div>
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

      <ShadowCoachChecklistModal
        scheduledClassId={session.scheduledClassId}
        classTitle={session.classTitle}
        shadowCoachName={session.shadowCoach?.name}
        open={shadowChecklistOpen}
        onClose={() => setShadowChecklistOpen(false)}
      />

      <AssignShadowCoachDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        scheduledClassId={session.scheduledClassId}
        classTitle={session.classTitle}
        startTime={session.startTime}
        endTime={session.endTime}
        location={session.location}
        leadCoachName={session.coachName || session.coachNames}
        currentShadowCoachId={session.shadowCoach?.id}
        currentShadowCoachName={session.shadowCoach?.name}
        onAssigned={() => {
          onUpdated?.();
          onClose();
        }}
      />
    </>
  );
}
