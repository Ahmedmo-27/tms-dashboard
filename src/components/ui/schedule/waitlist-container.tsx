"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Search,
  UserX,
  X,
  Copy,
  Check,
  MessageCircle,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WaitlistMember } from "./columns";
import {
  promoteFromWaitlist,
  removeFromWaitlist,
  getWaitlistedMembers,
} from "@/lib/data/bookings";
import { toast } from "react-hot-toast";
import { whatsAppHref } from "@/lib/utils/phone";
import { AddToWaitlistDialog } from "../dialogs/schedule/add-to-waitlist-dialog";

function WaitlistCountdown({ expiresAt }: { expiresAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
      } else {
        const totalSec = Math.floor(diff / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
        setIsExpired(false);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || !timeLeft) return null;

  return (
    <span
      className={`text-[9px] font-mono px-1 py-0.5 rounded border inline-flex items-center gap-0.5 ${
        isExpired
          ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400 font-semibold"
          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
      }`}
      title={`Reservation window expires at ${new Date(expiresAt).toLocaleTimeString()}`}
    >
      <span>⏳</span>
      <span>${timeLeft}</span>
    </span>
  );
}

export function WaitlistContainer({
  waitlist,
  scid,
  onWaitlistChange,
}: {
  waitlist: WaitlistMember[];
  scid?: string;
  onWaitlistChange?: (items: WaitlistMember[]) => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<WaitlistMember[]>(waitlist);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    setItems(waitlist);
  }, [waitlist]);

  const filteredItems = items.filter(
    (member) =>
      (member.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone || "").includes(searchQuery)
  );

  const handleCopy = (phone: string, index: number) => {
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleConfirm = async (member: WaitlistMember) => {
    if (!scid || !member.uid) return;
    try {
      setLoadingUid(member.uid);
      await promoteFromWaitlist(member.uid, scid);
      const updated = items.filter((m) => m.uid !== member.uid);
      setItems(updated);
      onWaitlistChange?.(updated);
      router.refresh();
      toast.success(`Booking confirmed for ${member.name}! Transferred to class.`);
    } catch (err: any) {
      console.error("Confirm waitlist error:", err);
      toast.error(err?.message || "Failed to confirm booking from waitlist");
    } finally {
      setLoadingUid(null);
    }
  };

  const handleRemove = async (member: WaitlistMember) => {
    if (!scid || !member.uid) return;
    try {
      setLoadingUid(member.uid);
      await removeFromWaitlist(member.uid, scid);
      const updated = items.filter((m) => m.uid !== member.uid);
      setItems(updated);
      onWaitlistChange?.(updated);
      router.refresh();
      toast.success("Member removed from waitlist");
    } catch (err: any) {
      console.error("Remove waitlist error:", err);
      toast.error(err?.message || "Failed to remove member from waitlist");
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">Waiting List</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-normal px-2 py-0.5"
            >
              {filteredItems.length}/{items.length}
            </Badge>
            {scid && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 gap-1 cursor-pointer text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-3 w-3" />
                Add Member
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search waitlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 text-sm rounded-md"
          />
        </div>

        {/* Waitlist Members List */}
        <ScrollArea className="h-[240px] pr-2">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col h-24 items-center justify-center text-xs text-muted-foreground space-y-1">
              <UserX className="h-5 w-5 text-muted-foreground" />
              <span>
                {searchQuery ? "No matching members" : "No members in the waiting list"}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredItems.map((member, index) => {
                const isItemLoading = loadingUid === member.uid;
                const isNotified = member.status === "NOTIFIED";
                return (
                  <div
                    key={member._id || member.uid || index}
                    className="flex items-center justify-between rounded-md border px-2.5 py-2 text-sm transition-colors hover:bg-muted/50 gap-2"
                  >
                    {/* Left side: Position + Avatar + Info */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                        #{member.position ?? index + 1}
                      </span>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium">
                        {(member.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="truncate text-xs font-medium leading-none">
                          {member.name}
                        </p>
                        {member.phone && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {member.phone}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {isNotified ? (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none"
                            >
                              Spot Reserved
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800"
                            >
                              Waiting
                            </Badge>
                          )}
                          {member.isManual && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/40"
                            >
                              Manual
                            </Badge>
                          )}
                          {isNotified && member.isManual && member.hasEligiblePackage === false && (
                            <Badge
                              variant="destructive"
                              className="text-[9px] px-1 py-0 bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 font-medium"
                              title="Member has no active package covering this class"
                            >
                              No Package
                            </Badge>
                          )}
                          {isNotified && member.reservationExpiresAt && (
                            <WaitlistCountdown expiresAt={member.reservationExpiresAt} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Contact actions + Confirmed + Remove */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {member.phone && (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 cursor-pointer"
                            aria-label={`Copy phone for ${member.name ?? "member"}`}
                            onClick={() => handleCopy(member.phone!, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                          {whatsAppHref(
                            member.phone,
                            isNotified && member.isManual && member.hasEligiblePackage === false
                              ? `Hello ${member.name || ""}, a slot just opened up for you in class! Please let us know if you'd like to book so we can lock in your spot.`
                              : undefined
                          ) && (
                            <a
                              href={whatsAppHref(
                                member.phone,
                                isNotified && member.isManual && member.hasEligiblePackage === false
                                  ? `Hello ${member.name || ""}, a slot just opened up for you in class! Please let us know if you'd like to book so we can lock in your spot.`
                                  : undefined
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`WhatsApp ${member.name ?? "member"}`}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
                              title={
                                isNotified && member.isManual && member.hasEligiblePackage === false
                                  ? "Contact member on WhatsApp to lock spot"
                                  : "Chat on WhatsApp"
                              }
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                            </a>
                          )}
                        </>
                      )}

                      {scid && member.uid && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer gap-1 shadow-xs font-medium"
                            disabled={isItemLoading}
                            onClick={() => handleConfirm(member)}
                            title={`Confirm booking for ${member.name} and transfer to class`}
                          >
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            Confirmed
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 cursor-pointer"
                            disabled={isItemLoading}
                            aria-label={`Remove ${member.name} from waitlist`}
                            onClick={() => handleRemove(member)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {showAddDialog && scid && (
        <AddToWaitlistDialog
          scid={scid}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={async () => {
            try {
              const refreshed = await getWaitlistedMembers(scid);
              setItems(refreshed);
              onWaitlistChange?.(refreshed);
              router.refresh();
            } catch {
              router.refresh();
            }
          }}
        />
      )}
    </Card>
  );
}
