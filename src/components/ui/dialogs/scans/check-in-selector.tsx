"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, UserX, UserCheck } from "lucide-react";
import { useState } from "react";
import { MemberListEntry } from "../../schedule/show-booked-members";
import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import { DialogContent } from "../../dialog";
import { attendNonUserBooking } from "@/lib/data/bookings";
import { AddWalkIn } from "./add-walk-in";

export function CheckInsSelector({
  members,
  classData,
}: {
  members: MemberListEntry[];
  classData: any;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAttendGuest = async (bookingId: string) => {
    try {
      setIsLoading(true);
      const result = await attendNonUserBooking(bookingId);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="cursor-pointer"
      >
        Manage Bookings
      </Button>
      <DialogContent className="pt-10 pb-5 px-5">
        <DialogTitle></DialogTitle>
        <Card className="w-full border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Booked Guests</span>
              </div>
              <Badge
                variant="secondary"
                className="text-xs font-normal px-2 py-0.5"
              >
                {filteredMembers.length}/{members.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm rounded-md"
              />
            </div>

            {/* Members List */}
            <ScrollArea className="h-[220px] pr-2">
              {filteredMembers.length === 0 ? (
                <div className="flex flex-col h-24 items-center justify-center text-xs text-muted-foreground space-y-1">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {searchQuery
                      ? "No matching members"
                      : "No members booked yet"}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredMembers.map(
                    (member, index) =>
                      member.bookingId &&
                      !member.paid &&
                      !member.attended && (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border px-2.5 py-2 text-sm transition-colors hover:bg-muted/50"
                        >
                          {/* Avatar + Info */}
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <p className="truncate text-xs font-medium leading-none">
                                {member.name}
                              </p>
                              {member.bookingId && (
                                <Badge
                                  variant="outline"
                                  className="mt-0.5 text-[10px] px-1.5 py-0"
                                >
                                  Guest
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Right side: Index + Cancel Button if bookingId exists */}
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground">
                              #{index + 1}
                            </p>
                            {member.bookingId &&
                              !isLoading &&
                              !member.attended && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-green-800"
                                  onClick={() =>
                                    handleAttendGuest(
                                      member.bookingId as string
                                    )
                                  }
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </div>
                      )
                  )}
                </div>
              )}
              <div className="mt-2">
                <AddWalkIn scid={(classData._id as any).toString()} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
