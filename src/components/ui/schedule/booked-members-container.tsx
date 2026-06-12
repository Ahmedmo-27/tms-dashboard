"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, UserX, X, Copy, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { MemberListEntry } from "./show-booked-members";
import { cancelNonUserBooking, recordManualAttendance, removeManualAttendance } from "@/lib/data/bookings";
import { toast } from "react-hot-toast";

export function BookedMembersContainer({
  members,
  scid,
}: {
  members: MemberListEntry[];
  scid?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const filteredMembers = members.filter((member) =>
    (member.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (phone: string, index: number) => {
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setIsLoading(true);
      const res = await cancelNonUserBooking(bookingId);
      console.log(res);
      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.log("error: ", err);
      setError(err as Error);
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordAttendance = async (uid: string) => {
    if (!scid) return;
    try {
      setIsLoading(true);
      await recordManualAttendance(uid, scid);
      toast.success("Attendance recorded");
    } catch (err) {
      setError(err as Error);
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAttendance = async (uid: string) => {
    if (!scid) return;
    try {
      setIsLoading(true);
      await removeManualAttendance(uid, scid);
      toast.success("Attendance removed");
    } catch (err) {
      setError(err as Error);
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="pb-2"> 
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Booked Members</span>
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
                {searchQuery ? "No matching members" : "No members booked yet"}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border px-2.5 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium">
                      {(member.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <p className="truncate text-xs font-medium leading-none">
                        {member.name}
                      </p>
                      {member.phone && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {member.phone}
                        </p>
                      )}
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

                  {/* Right side: Phone actions + Index + Cancel */}
                  <div className="flex items-center gap-2">
                    {member.phone && (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleCopy(member.phone!, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <a
                          href={`https://wa.me/${member.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                        </a>
                      </>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      #{index + 1}
                    </p>
                    {member.bookingId && !isLoading && !member.attended && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelBooking(member.bookingId!)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {member.uid && !isLoading && !member.attended && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 text-green-600 hover:bg-green-50"
                        onClick={() => handleRecordAttendance(member.uid!)}
                      >
                        Record
                      </Button>
                    )}
                    {member.uid && !isLoading && member.attended && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveAttendance(member.uid!)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
