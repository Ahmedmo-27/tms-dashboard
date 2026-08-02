"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { Package } from "@/components/ui/packages/columns";
import { Member } from "@/components/ui/members/columns";
import { bookClassAction } from "@/lib/actions/member-actions";
import { tms } from "@/lib/tms-api";
import { parseMembers } from "@/lib/utils/parsers/members-parser";
import {
  getActivePackagesSummary,
  getBookingEligibility,
  isBookingTimeRestriction,
} from "@/lib/utils/booking-eligibility";
import { ApiError } from "@/core/api-error";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppSelector } from "@/lib/hooks";
import { canOverrideBookingTimeRestrictions } from "@/lib/config/roles";

type MemberSearchHit = {
  id: string;
  name: string;
  phone: string;
};

interface BookMemberClassDialogProps {
  scheduledClasses: ScheduledClass[];
  allScheduledClasses: ScheduledClass[];
  catalogPackages: Package[];
  date: Date;
}

export function BookMemberClassDialog({
  scheduledClasses,
  allScheduledClasses,
  catalogPackages,
  date,
}: BookMemberClassDialogProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const canOverrideTime = canOverrideBookingTimeRestrictions(
    user?.role as string | undefined
  );
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [overrideTimeRestrictions, setOverrideTimeRestrictions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const selectedClass = useMemo(
    () => scheduledClasses.find((cls) => cls._id === selectedClassId) ?? null,
    [scheduledClasses, selectedClassId]
  );

  const eligibility = useMemo(() => {
    if (!selectedMember || !selectedClass) return null;
    return getBookingEligibility(
      selectedMember,
      selectedClass,
      catalogPackages,
      allScheduledClasses,
      {
        overrideTimeRestrictions:
          canOverrideTime && overrideTimeRestrictions,
      }
    );
  }, [
    selectedMember,
    selectedClass,
    catalogPackages,
    allScheduledClasses,
    canOverrideTime,
    overrideTimeRestrictions,
  ]);

  const requiresTimeOverride =
    !!selectedMember &&
    !!selectedClass &&
    isBookingTimeRestriction(
      getBookingEligibility(
        selectedMember,
        selectedClass,
        catalogPackages,
        allScheduledClasses
      )
    );

  const activePackagesSummary = useMemo(() => {
    if (!selectedMember) return [];
    return getActivePackagesSummary(selectedMember, catalogPackages);
  }, [selectedMember, catalogPackages]);

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedMember(null);
    setSelectedClassId("");
    setOverrideTimeRestrictions(false);
    setShowSuggestions(false);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      resetForm();
    }
  };

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const params: Record<string, string | number> = { page: 1, limit: 10 };
        if (/^\d+$/.test(searchQuery)) {
          params.phone = searchQuery;
        } else {
          params.name = searchQuery;
        }

        const response = await tms.get("/admin/member", { params });
        const members = response.data.data.members ?? [];
        setSearchResults(
          members.map((member: any) => ({
            id: member.uid._id,
            name: member.uid.name,
            phone: member.uid.phoneNumber,
          }))
        );
        setShowSuggestions(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadMember = async (uid: string, name: string) => {
    setIsLoadingMember(true);
    setSelectedMember(null);
    setSelectedClassId("");

    try {
      const response = await tms.get("/admin/member", {
        params: { uid, page: 1, limit: 1 },
      });
      const members = parseMembers(response.data.data.members ?? []);
      const member = members[0];

      if (!member) {
        toast.error("Member not found");
        return;
      }

      setSelectedMember(member);
      setSearchQuery(name);
      setShowSuggestions(false);
    } catch {
      toast.error("Failed to load member details");
    } finally {
      setIsLoadingMember(false);
    }
  };

  const initialState = { success: false, errors: null, data: null };
  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await bookClassAction(currentState, formData);

      if (result.success) {
        toast.success("Class booked successfully");
        setOpen(false);
        resetForm();
        router.refresh();
        return initialState;
      }

      return result;
    },
    initialState
  );

  const canSubmit =
    !!selectedMember &&
    !!selectedClassId &&
    eligibility?.eligible === true &&
    !pending;

  useEffect(() => {
    setOverrideTimeRestrictions(false);
  }, [selectedClassId]);

  const errorMessage =
    state?.errors && typeof state.errors === "object"
      ? "message" in state.errors
        ? (state.errors as { message?: string }).message
        : state.errors instanceof ApiError
          ? state.errors.message
          : undefined
      : undefined;

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Book a class
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book a class</DialogTitle>
            <DialogDescription>
              Search for a member and book a class from their package for{" "}
              {date.toLocaleDateString()}.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <input
              type="hidden"
              name="uid"
              value={selectedMember?.id ?? ""}
            />
            <input type="hidden" name="clsId" value={selectedClassId} />
            <input
              type="hidden"
              name="overrideTimeRestrictions"
              value={overrideTimeRestrictions ? "true" : "false"}
            />

            <div className="space-y-2" ref={searchRef}>
              <Label className="text-sm font-medium">Search member</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name or phone number"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    if (
                      selectedMember &&
                      event.target.value !== selectedMember.name
                    ) {
                      setSelectedMember(null);
                      setSelectedClassId("");
                    }
                  }}
                  className="pl-8"
                  disabled={pending}
                />
              </div>
              {isSearching && (
                <p className="text-xs text-muted-foreground">Searching…</p>
              )}
              {showSuggestions && searchResults.length > 0 && !selectedMember && (
                <div className="rounded-md border max-h-40 overflow-y-auto">
                  {searchResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex flex-col"
                      onClick={() => loadMember(member.id, member.name)}
                    >
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.phone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions &&
                searchResults.length === 0 &&
                searchQuery.length >= 2 &&
                !isSearching &&
                !selectedMember && (
                  <p className="text-xs text-muted-foreground">
                    No members found
                  </p>
                )}
              {isLoadingMember && (
                <p className="text-xs text-muted-foreground">
                  Loading member details…
                </p>
              )}
              {selectedMember && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Selected: {selectedMember.name}
                </p>
              )}
            </div>

            {selectedMember && activePackagesSummary.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">Active packages</p>
                {activePackagesSummary.map((pkg) => (
                  <div key={pkg.name} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {pkg.name}
                    </span>
                    {" — "}
                    {pkg.remainingClasses} session
                    {pkg.remainingClasses === 1 ? "" : "s"} left
                    {pkg.opensTitles.length > 0 && (
                      <span> • Covers: {pkg.opensTitles.join(", ")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedMember && activePackagesSummary.length === 0 && (
              <p className="text-sm text-destructive">
                This member has no active packages with remaining sessions.
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={!selectedMember || pending || scheduledClasses.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {scheduledClasses.map((cls) => {
                    const classEligibility = selectedMember
                      ? getBookingEligibility(
                          selectedMember,
                          cls,
                          catalogPackages,
                          allScheduledClasses
                        )
                      : null;
                    const selectableDespiteTime =
                      canOverrideTime &&
                      classEligibility &&
                      isBookingTimeRestriction(classEligibility);

                    return (
                      <SelectItem
                        key={cls._id}
                        value={cls._id ?? ""}
                        disabled={
                          classEligibility?.eligible === false &&
                          !selectableDespiteTime
                        }
                        className="hover:bg-accent"
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <span>{cls.className}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(cls.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {cls.availableSlots} slots
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {scheduledClasses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No classes scheduled for this day.
                </p>
              )}
            </div>

            {selectedClass && eligibility && (
              <div
                className={
                  eligibility.eligible
                    ? "rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                    : "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                }
              >
                {eligibility.eligible ? (
                  <>
                    Member can book this class using package{" "}
                    <span className="font-medium">
                      {eligibility.coveringPackageName}
                    </span>
                    .
                    {overrideTimeRestrictions && requiresTimeOverride && (
                      <span className="block mt-1 text-xs">
                        Booking with time restriction override.
                      </span>
                    )}
                  </>
                ) : (
                  eligibility.reason
                )}
              </div>
            )}

            {canOverrideTime && requiresTimeOverride && selectedMember && (
              <div className="flex gap-2 items-start">
                <Checkbox
                  id="override-time-restrictions"
                  checked={overrideTimeRestrictions}
                  onCheckedChange={(checked) =>
                    setOverrideTimeRestrictions(checked === true)
                  }
                  disabled={pending}
                />
                <label
                  htmlFor="override-time-restrictions"
                  className="cursor-pointer text-sm leading-snug"
                >
                  Override time restriction — allow booking even though this
                  class has already started
                </label>
              </div>
            )}

            {errorMessage && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {pending ? "Booking…" : "Book class"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
