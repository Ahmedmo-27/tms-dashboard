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
  openGymGuestDropInAction,
  openGymMemberDropInAction,
} from "@/lib/actions/open-gym-actions";
import { tms } from "@/lib/tms-api";
import { Search, ArrowBigRight } from "lucide-react";
import { ApiError } from "@/core/api-error";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

interface OpenGymDropInDialogProps {
  uid?: string;
  memberName?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerClassName?: string;
}

export function OpenGymDropInDialog({
  uid: presetUid,
  memberName: presetMemberName,
  triggerLabel = "Open gym drop-in",
  triggerVariant = "outline",
  triggerClassName,
}: OpenGymDropInDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"member" | "guest">("member");
  const [defaultPrice, setDefaultPrice] = useState<string>("");

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
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
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
    setAmount(defaultPrice);
    setPaymentDate("");
    setMemberPaymentMethod("CASH");
    setGuestPaymentMethod("CASH");
    setShowEdits(false);
    setPriceChanged(false);
    setTab(presetUid ? "member" : "member");
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      if (presetUid) {
        setSelectedUid(presetUid);
        setSelectedMemberName(presetMemberName ?? "");
        setSearchQuery(presetMemberName ?? "");
      }
      tms
        .get("/admin/openGym/dropInPrice")
        .then((res) => {
          const price = String(res.data.data.price ?? "");
          setDefaultPrice(price);
          setAmount(price);
        })
        .catch(() => {
          setDefaultPrice("");
        });
    } else {
      resetForm();
    }
  };

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
        const members = response.data.data.members ?? [];
        setSearchResults(
          members.map((m: any) => ({
            id: m.uid._id,
            name: m.uid.name,
            phone: m.uid.phoneNumber,
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
  }, [searchQuery, presetUid]);

  const memberInitialState = { success: false, errors: null, data: null };
  const [memberState, memberFormAction, memberPending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await openGymMemberDropInAction(currentState, formData);
      if (result.success) {
        toast.success("Open gym drop-in recorded");
        setOpen(false);
        router.refresh();
        return memberInitialState;
      }
      return result;
    },
    memberInitialState
  );

  const guestInitialState = { success: false, errors: null, data: null };
  const [guestState, guestFormAction, guestPending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await openGymGuestDropInAction(currentState, formData);
      if (result.success) {
        toast.success("Guest open gym drop-in recorded");
        setOpen(false);
        router.refresh();
        return guestInitialState;
      }
      if ((result as any)?.usrId) {
        return result;
      }
      return result;
    },
    guestInitialState
  );

  return (
    <div>
      <Button
        variant={triggerVariant}
        size="sm"
        className={triggerClassName}
        onClick={() => handleOpenChange(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open gym drop-in</DialogTitle>
            <DialogDescription>
              Open gym is always available — no schedule slot required. Record a
              paid visit for members or guests.
            </DialogDescription>
          </DialogHeader>

          {defaultPrice && (
            <p className="text-sm text-muted-foreground">
              Default drop-in price: <span className="font-medium">EGP{defaultPrice}</span>
            </p>
          )}

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "member" | "guest")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="member">Member</TabsTrigger>
              <TabsTrigger value="guest">Guest / Non-member</TabsTrigger>
            </TabsList>

            <TabsContent value="member">
              <form action={memberFormAction} className="space-y-4 mt-2">
                <input type="hidden" name="uid" value={selectedUid} />
                <input
                  type="hidden"
                  name="paymentMethod"
                  value={memberPaymentMethod}
                />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="paymentDate" value={paymentDate} />
                <input
                  type="hidden"
                  name="priceChanged"
                  value={String(priceChanged && showEdits)}
                />

                {!presetUid && (
                  <div className="space-y-2" ref={searchRef}>
                    <Label className="text-sm font-medium">Search member</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Name or phone number"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (selectedUid && e.target.value !== selectedMemberName) {
                            setSelectedUid("");
                            setSelectedMemberName("");
                          }
                        }}
                        className="pl-8"
                      />
                    </div>
                    {isSearching && (
                      <p className="text-xs text-muted-foreground">Searching…</p>
                    )}
                    {showSuggestions && searchResults.length > 0 && (
                      <div className="rounded-md border max-h-40 overflow-y-auto">
                        {searchResults.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex flex-col"
                            onClick={() => {
                              setSelectedUid(member.id);
                              setSelectedMemberName(member.name);
                              setSearchQuery(member.name);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="font-medium">{member.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {member.phone}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedUid && (
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Selected: {selectedMemberName}
                      </p>
                    )}
                  </div>
                )}

                {presetUid && presetMemberName && (
                  <p className="text-sm">
                    Member: <span className="font-medium">{presetMemberName}</span>
                  </p>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment method</Label>
                  <Select
                    defaultValue="CASH"
                    onValueChange={setMemberPaymentMethod}
                    disabled={memberPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 items-center">
                  <Checkbox
                    checked={showEdits}
                    onCheckedChange={() => setShowEdits((prev) => !prev)}
                  />
                  <p
                    className="cursor-pointer text-sm"
                    onClick={() => setShowEdits((prev) => !prev)}
                  >
                    Edit payment amount or date
                  </p>
                </div>

                {showEdits && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Amount (EGP)</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Payment date</Label>
                      <PopoverDatePicker
                        className="w-full"
                        selectedDate={
                          paymentDate ? new Date(paymentDate) : undefined
                        }
                        handleDateChange={setPaymentDate}
                      />
                    </div>
                  </div>
                )}

                {memberState?.errors &&
                  typeof memberState.errors === "object" &&
                  "message" in memberState.errors && (
                    <p className="text-destructive text-sm">
                      {(memberState.errors as ApiError).message}
                    </p>
                  )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={memberPending || !selectedUid}>
                    {memberPending ? "Saving…" : "Record drop-in"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="guest">
              <form action={guestFormAction} className="space-y-4 mt-2">
                <input
                  type="hidden"
                  name="paymentMethod"
                  value={guestPaymentMethod}
                />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="paymentDate" value={paymentDate} />
                <input
                  type="hidden"
                  name="priceChanged"
                  value={String(priceChanged && showEdits)}
                />

                <div className="space-y-2">
                  <Label htmlFor="guest-name">Full name</Label>
                  <Input
                    id="guest-name"
                    name="name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g., Ahmed Hassan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest-phone">Phone number</Label>
                  <Input
                    id="guest-phone"
                    name="phoneNumber"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="11-digit phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment method</Label>
                  <Select
                    defaultValue="CASH"
                    onValueChange={setGuestPaymentMethod}
                    disabled={guestPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 items-center">
                  <Checkbox
                    checked={showEdits}
                    onCheckedChange={() => setShowEdits((prev) => !prev)}
                  />
                  <p
                    className="cursor-pointer text-sm"
                    onClick={() => setShowEdits((prev) => !prev)}
                  >
                    Edit payment amount or date
                  </p>
                </div>

                {showEdits && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guest-amount">Amount (EGP)</Label>
                      <Input
                        id="guest-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Payment date</Label>
                      <PopoverDatePicker
                        className="w-full"
                        selectedDate={
                          paymentDate ? new Date(paymentDate) : undefined
                        }
                        handleDateChange={setPaymentDate}
                      />
                    </div>
                  </div>
                )}

                {(guestState as any)?.errors?.userExists && (
                  <div className="flex items-center justify-between rounded-md border border-destructive p-3">
                    <p className="text-destructive text-sm font-medium">
                      User already exists — open their profile to book
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `/dashboard/our-members/${(guestState as any).usrId}`,
                          "_blank"
                        )
                      }
                    >
                      <ArrowBigRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {guestState?.errors &&
                  typeof guestState.errors === "object" &&
                  "message" in guestState.errors &&
                  !(guestState.errors as any).userExists && (
                    <p className="text-destructive text-sm">
                      {(guestState.errors as ApiError).message}
                    </p>
                  )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={guestPending}>
                    {guestPending ? "Saving…" : "Record guest drop-in"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
