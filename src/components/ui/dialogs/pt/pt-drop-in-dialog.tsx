"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
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
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ptGuestDropInAction,
  ptMemberDropInAction,
} from "@/lib/actions/pt-actions";
import { tms } from "@/lib/tms-api";
import { Search, ArrowBigRight } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OpenGymBranchSelect } from "@/components/ui/open-gym/branch-select";
import { useManagementBranchSelection } from "@/lib/hooks/use-management-branch-selection";
import { PtPricingDialog } from "./pt-pricing-dialog";
import { CoachSearchSelect } from "@/components/ui/coach-search-select";

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
];

type MemberSearchHit = {
  id: string;
  name: string;
  phone: string;
};

export type CoachOption = {
  _id: string;
  coachName: string;
};

interface PtDropInDialogProps {
  uid?: string;
  memberName?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerClassName?: string;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  coaches?: CoachOption[];
}

type FormState = {
  success: boolean;
  errors: any;
  data: any;
  usrId?: string;
};

export function PtDropInDialog({
  uid: presetUid,
  memberName: presetMemberName,
  triggerLabel = "PT drop-in",
  triggerVariant = "outline",
  triggerClassName,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  onSuccess,
  coaches: preloadedCoaches,
}: PtDropInDialogProps) {
  const router = useRouter();
  const {
    locationId,
    setModalLocationId,
    needsBranchSelection,
    hasLocationId,
    resetModalBranch,
  } = useManagementBranchSelection();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const [tab, setTab] = useState<"member" | "guest">("member");
  const [defaultPrice, setDefaultPrice] = useState<string>("750");

  const [coaches, setCoaches] = useState<CoachOption[]>(preloadedCoaches ?? []);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");

  const [selectedUid, setSelectedUid] = useState(presetUid ?? "");
  const [selectedMemberName, setSelectedMemberName] = useState(
    presetMemberName ?? ""
  );
  const [searchQuery, setSearchQuery] = useState(presetMemberName ?? "");
  const [searchResults, setSearchResults] = useState<MemberSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [amount, setAmount] = useState("750");
  const [paymentDate, setPaymentDate] = useState("");
  const [note, setNote] = useState("");
  const [memberPaymentMethod, setMemberPaymentMethod] = useState("CASH");
  const [guestPaymentMethod, setGuestPaymentMethod] = useState("CASH");
  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  const resetForm = () => {
    if (!presetUid) {
      setSelectedUid("");
      setSelectedMemberName("");
      setSearchQuery("");
    }
    setGuestName("");
    setGuestPhone("");
    setAmount(defaultPrice || "750");
    setPaymentDate("");
    setNote("");
    setSelectedCoachId("");
    setMemberPaymentMethod("CASH");
    setGuestPaymentMethod("CASH");
    setShowEdits(false);
    setPriceChanged(false);
    setTab("member");
  };

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) setUncontrolledOpen(value);
    onOpenChange?.(value);
    if (value) {
      resetModalBranch();
      if (presetUid) {
        setSelectedUid(presetUid);
        setSelectedMemberName(presetMemberName ?? "");
        setSearchQuery(presetMemberName ?? "");
      }
    } else {
      resetForm();
    }
  };

  // Fetch coaches if not passed as prop
  useEffect(() => {
    if (!open) return;
    if (preloadedCoaches && preloadedCoaches.length > 0) {
      setCoaches(preloadedCoaches);
      return;
    }
    tms
      .get("/admin/coaches")
      .then((res) => {
        const list = res.data?.data ?? [];
        setCoaches(list);
      })
      .catch(() => {
        // non-blocking
      });
  }, [open, preloadedCoaches]);

  // Fetch PT drop-in price (defaults to 750 or branch/coach setting)
  const fetchPrice = () => {
    if (!locationId) {
      setDefaultPrice("750");
      if (!priceChanged) setAmount("750");
      return;
    }
    const params: Record<string, string> = { locationId };
    if (selectedCoachId) {
      params.coachId = selectedCoachId;
    }
    tms
      .get("/admin/pt/dropInPrice", { params })
      .then((res) => {
        const price = String(res.data?.data?.price ?? 750);
        setDefaultPrice(price);
        if (!priceChanged) {
          setAmount(price);
        }
      })
      .catch(() => {
        setDefaultPrice("750");
        if (!priceChanged) setAmount("750");
      });
  };

  useEffect(() => {
    if (open) {
      fetchPrice();
    }
  }, [open, locationId, selectedCoachId]);

  useEffect(() => {
    setPriceChanged(amount !== defaultPrice && defaultPrice !== "");
  }, [amount, defaultPrice]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (presetUid || searchQuery.length < 2) {
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
        const members = response.data?.data?.members ?? [];
        const seen = new Set<string>();
        const uniqueHits: MemberSearchHit[] = [];
        for (const m of members) {
          const rawId = m.uid?._id ?? m._id;
          const id = rawId ? String(rawId) : "";
          if (id && !seen.has(id)) {
            seen.add(id);
            uniqueHits.push({
              id,
              name: m.uid?.name || "Unknown",
              phone: m.uid?.phoneNumber || "",
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
  }, [searchQuery, presetUid]);

  const memberInitialState: FormState = { success: false, errors: null, data: null };
  const [memberState, memberFormAction, memberPending] = useActionState<FormState, FormData>(
    async (currentState: FormState, formData: FormData) => {
      const result = await ptMemberDropInAction(currentState, formData);
      if (result.success) {
        toast.success("Personal training drop-in recorded");
        handleOpenChange(false);
        onSuccess?.();
        router.refresh();
        return memberInitialState;
      }
      return result;
    },
    memberInitialState
  );

  const guestInitialState: FormState = { success: false, errors: null, data: null };
  const [guestState, guestFormAction, guestPending] = useActionState<FormState, FormData>(
    async (currentState: FormState, formData: FormData) => {
      const result = await ptGuestDropInAction(currentState, formData);
      if (result.success) {
        toast.success("Guest personal training drop-in recorded");
        handleOpenChange(false);
        onSuccess?.();
        router.refresh();
        return guestInitialState;
      }
      return result;
    },
    guestInitialState
  );

  const handleSelectMember = (hit: MemberSearchHit) => {
    setSelectedUid(hit.id);
    setSelectedMemberName(hit.name);
    setSearchQuery(hit.name);
    setShowSuggestions(false);
  };

  const handleSwitchToMember = (foundUid: string) => {
    setSelectedUid(foundUid);
    setSelectedMemberName(guestName || "Existing Member");
    setSearchQuery(guestName || "");
    setTab("member");
  };

  const triggerButton = (
    <Button
      type="button"
      variant={triggerVariant}
      size="sm"
      className={triggerClassName}
      onClick={() => handleOpenChange(true)}
    >
      {triggerLabel}
    </Button>
  );

  return (
    <>
      {!hideTrigger && triggerButton}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Personal Training Drop-In</DialogTitle>
            <DialogDescription>
              Record a single-session PT drop-in for a member or walk-in guest.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(val) => setTab(val as "member" | "guest")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="member">Member</TabsTrigger>
              <TabsTrigger value="guest">Guest</TabsTrigger>
            </TabsList>

            {/* MEMBER TAB */}
            <TabsContent value="member" className="space-y-4 pt-2">
              <form action={memberFormAction} className="space-y-4">
                <input type="hidden" name="uid" value={selectedUid} />
                <input type="hidden" name="locationId" value={locationId} />
                <input type="hidden" name="coachId" value={selectedCoachId} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="paymentDate" value={paymentDate} />
                <input type="hidden" name="note" value={note} />
                <input
                  type="hidden"
                  name="priceChanged"
                  value={String(priceChanged)}
                />

                {needsBranchSelection && (
                  <OpenGymBranchSelect
                    value={locationId}
                    onChange={setModalLocationId}
                  />
                )}

                {/* Member Search */}
                <div className="space-y-1.5" ref={searchRef}>
                  <Label>Member</Label>
                  {presetUid ? (
                    <Input
                      value={presetMemberName || presetUid}
                      disabled
                      className="bg-muted"
                    />
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Input
                          placeholder="Search member by name or phone..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedUid) {
                              setSelectedUid("");
                              setSelectedMemberName("");
                            }
                          }}
                          onFocus={() => {
                            if (searchResults.length > 0)
                              setShowSuggestions(true);
                          }}
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>

                      {showSuggestions && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                          {searchResults.map((hit, idx) => (
                            <button
                              key={`${hit.id}-${idx}`}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center"
                              onClick={() => handleSelectMember(hit)}
                            >
                              <span className="font-medium">{hit.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {hit.phone}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedMemberName && !presetUid && (
                    <p className="text-xs text-green-600 font-medium">
                      Selected: {selectedMemberName}
                    </p>
                  )}
                </div>

                {/* Coach Selection */}
                <div className="space-y-1.5">
                  <Label>
                    Trainer <span className="text-destructive">*</span>
                  </Label>
                  <CoachSearchSelect
                    coaches={coaches as any}
                    value={selectedCoachId}
                    onChange={(val) => setSelectedCoachId(val)}
                    placeholder="Select a trainer"
                    searchPlaceholder="Search trainer by name..."
                    disabled={memberPending}
                  />
                  {!selectedCoachId && (
                    <p className="text-[11px] text-muted-foreground">
                      Please select the trainer taking this session.
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select
                    name="paymentMethod"
                    value={memberPaymentMethod}
                    onValueChange={setMemberPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Display / Edit Toggle */}
                <div className="rounded-lg border p-3 space-y-3 bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">Price</span>
                      <PtPricingDialog
                        triggerLabel="Edit fixed price"
                        variant="ghost"
                        size="sm"
                        triggerClassName="text-xs h-6 px-1.5 text-primary hover:underline font-normal"
                        onPriceUpdated={fetchPrice}
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {amount ? `${amount} EGP` : `${defaultPrice || "750"} EGP`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pt-member-show-edits"
                      checked={showEdits}
                      onCheckedChange={(c) => setShowEdits(Boolean(c))}
                    />
                    <Label
                      htmlFor="pt-member-show-edits"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Show custom price / payment date / note
                    </Label>
                  </div>

                  {showEdits && (
                    <div className="space-y-3 pt-1 border-t">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Amount (EGP)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Payment Date</Label>
                        <PopoverDatePicker
                          className="w-full"
                          selectedDate={
                            paymentDate ? new Date(paymentDate) : undefined
                          }
                          handleDateChange={setPaymentDate}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Note</Label>
                        <Input
                          placeholder="Optional note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {memberState?.errors && (
                  <p className="text-sm text-red-500">
                    {typeof memberState.errors === "string"
                      ? memberState.errors
                      : Object.values(memberState.errors).filter(Boolean).join(", ")}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={memberPending || !selectedUid || !hasLocationId || !selectedCoachId}
                >
                  {memberPending ? "Recording..." : "Record PT Drop-In"}
                </Button>
              </form>
            </TabsContent>

            {/* GUEST TAB */}
            <TabsContent value="guest" className="space-y-4 pt-2">
              <form action={guestFormAction} className="space-y-4">
                <input type="hidden" name="locationId" value={locationId} />
                <input type="hidden" name="coachId" value={selectedCoachId} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="paymentDate" value={paymentDate} />
                <input type="hidden" name="note" value={note} />
                <input
                  type="hidden"
                  name="priceChanged"
                  value={String(priceChanged)}
                />

                {needsBranchSelection && (
                  <OpenGymBranchSelect
                    value={locationId}
                    onChange={setModalLocationId}
                  />
                )}

                {/* Guest Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Guest Name</Label>
                    <Input
                      name="name"
                      placeholder="Full name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input
                      name="phoneNumber"
                      placeholder="01XXXXXXXXX"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Coach Selection */}
                <div className="space-y-1.5">
                  <Label>
                    Trainer <span className="text-destructive">*</span>
                  </Label>
                  <CoachSearchSelect
                    coaches={coaches as any}
                    value={selectedCoachId}
                    onChange={(val) => setSelectedCoachId(val)}
                    placeholder="Select a trainer"
                    searchPlaceholder="Search trainer by name..."
                    disabled={guestPending}
                  />
                  {!selectedCoachId && (
                    <p className="text-[11px] text-muted-foreground">
                      Please select the trainer taking this session.
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select
                    name="paymentMethod"
                    value={guestPaymentMethod}
                    onValueChange={setGuestPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Display / Edit Toggle */}
                <div className="rounded-lg border p-3 space-y-3 bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">Price</span>
                      <PtPricingDialog
                        triggerLabel="Edit fixed price"
                        variant="ghost"
                        size="sm"
                        triggerClassName="text-xs h-6 px-1.5 text-primary hover:underline font-normal"
                        onPriceUpdated={fetchPrice}
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {amount ? `${amount} EGP` : `${defaultPrice || "750"} EGP`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pt-guest-show-edits"
                      checked={showEdits}
                      onCheckedChange={(c) => setShowEdits(Boolean(c))}
                    />
                    <Label
                      htmlFor="pt-guest-show-edits"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Show custom price / payment date / note
                    </Label>
                  </div>

                  {showEdits && (
                    <div className="space-y-3 pt-1 border-t">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Amount (EGP)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Payment Date</Label>
                        <PopoverDatePicker
                          className="w-full"
                          selectedDate={
                            paymentDate ? new Date(paymentDate) : undefined
                          }
                          handleDateChange={setPaymentDate}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Note</Label>
                        <Input
                          placeholder="Optional note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Member already exists prompt */}
                {guestState?.errors?.userExists && (
                  <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-xs">
                    <span className="text-yellow-800 dark:text-yellow-200">
                      Member exists with this phone number.
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold text-yellow-900 dark:text-yellow-100 hover:underline"
                      onClick={() =>
                        handleSwitchToMember((guestState as any).usrId)
                      }
                    >
                      Book as member <ArrowBigRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {guestState?.errors && !guestState.errors.userExists && (
                  <p className="text-sm text-red-500">
                    {typeof guestState.errors === "string"
                      ? guestState.errors
                      : Object.values(guestState.errors).filter(Boolean).join(", ")}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    guestPending ||
                    !guestName.trim() ||
                    !guestPhone.trim() ||
                    !hasLocationId ||
                    !selectedCoachId
                  }
                >
                  {guestPending ? "Recording..." : "Record Guest PT Drop-In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
