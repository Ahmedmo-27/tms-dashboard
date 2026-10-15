"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Search, Clock, User, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScheduledClassSearchSelect } from "@/components/ui/scheduled-class-search-select";
import { Badge } from "@/components/ui/badge";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { addToWaitlist, getWaitlistedMembers } from "@/lib/data/bookings";
import { getMembers } from "@/lib/data/member";
import { format } from "date-fns";

type MemberSearchHit = {
  id: string;
  name: string;
  phone: string;
};

interface AddToWaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledClass?: ScheduledClass;
  scid?: string;
  className?: string;
  scheduledClasses?: ScheduledClass[];
  onSuccess?: () => void;
}

export function AddToWaitlistDialog({
  open,
  onOpenChange,
  scheduledClass,
  scid,
  className,
  scheduledClasses,
  onSuccess,
}: AddToWaitlistDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchHit | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    scheduledClass?._id || scid || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isClassFixed = Boolean(scheduledClass?._id || scid);

  // Sync class ID when prop changes
  useEffect(() => {
    if (scheduledClass?._id) {
      setSelectedClassId(scheduledClass._id);
    } else if (scid) {
      setSelectedClassId(scid);
    }
  }, [scheduledClass, scid]);

  const activeClass = useMemo(() => {
    if (scheduledClass) return scheduledClass;
    if (scheduledClasses && selectedClassId) {
      return scheduledClasses.find((c) => c._id === selectedClassId) || null;
    }
    return null;
  }, [scheduledClass, scheduledClasses, selectedClassId]);

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedMember(null);
    setShowSuggestions(false);
    if (!isClassFixed) {
      setSelectedClassId("");
    }
  };

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      resetForm();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Debounced search for members
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const trimmed = searchQuery.trim();
        const response = await getMembers(trimmed, 1, 10);
        const members = response?.data ?? [];
        const seen = new Set<string>();
        const uniqueHits: MemberSearchHit[] = [];

        for (const m of members) {
          const id = m.id ? String(m.id) : "";
          if (id && !seen.has(id)) {
            seen.add(id);
            uniqueHits.push({
              id,
              name: m.name || "Unknown Member",
              phone: m.phone || "",
            });
          }
        }

        setSearchResults(uniqueHits);
        setShowSuggestions(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetScid = scheduledClass?._id || scid || selectedClassId;

    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }

    if (!targetScid) {
      toast.error("Please select a class");
      return;
    }

    try {
      setIsSubmitting(true);
      await addToWaitlist(selectedMember.id, targetScid);
      toast.success(`${selectedMember.name} added to waitlist successfully`);
      router.refresh();
      onSuccess?.();
      handleOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add member to waitlist";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <DialogTitle>Add to Waitlist</DialogTitle>
          </div>
          <DialogDescription>
            Search for a member to manually place them on the waiting list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Target Class Info or Selector */}
          {isClassFixed && activeClass ? (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {activeClass.className || className || "Selected Class"}
                </span>
                {activeClass.category && (
                  <Badge variant="outline" className="text-[10px]">
                    {activeClass.category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {format(new Date(activeClass.startTime), "HH:mm")} -{" "}
                  {format(new Date(activeClass.endTime), "HH:mm")}
                </span>
                {activeClass.coachName && (
                  <span>Coach: {activeClass.coachName}</span>
                )}
              </div>
            </div>
          ) : scheduledClasses && scheduledClasses.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="class-select" className="text-xs font-medium">
                Select Class <span className="text-destructive">*</span>
              </Label>
              <ScheduledClassSearchSelect
                id="class-select"
                classes={scheduledClasses}
                value={selectedClassId}
                onChange={setSelectedClassId}
                placeholder="Choose a scheduled class..."
                allowClear
              />
              {activeClass?.category && (
                <div className="pt-0.5">
                  <Badge variant="outline" className="text-[10px]">
                    {activeClass.category}
                  </Badge>
                </div>
              )}
            </div>
          ) : null}

          {/* Member Search & Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Member <span className="text-destructive">*</span>
            </Label>

            {selectedMember ? (
              <div className="flex items-center justify-between rounded-md border bg-primary/5 p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {(selectedMember.name || "M").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {selectedMember.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {selectedMember.phone}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setSelectedMember(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search member by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSuggestions(true);
                    }}
                    className="h-9 pl-8 pr-8 text-sm"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {searchResults.map((hit) => (
                      <button
                        key={hit.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={() => {
                          setSelectedMember(hit);
                          setShowSuggestions(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{hit.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {hit.phone}
                          </p>
                        </div>
                        <Check className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions &&
                  !isSearching &&
                  searchQuery.trim().length >= 2 &&
                  searchResults.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-xs text-muted-foreground shadow-md">
                      No members found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedMember || isSubmitting || (!activeClass && !selectedClassId)}
              className="gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Add to Waitlist
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
