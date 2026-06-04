"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package } from "@/components/ui/packages/columns";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../../checkbox";
import { subscribePackageAction } from "@/lib/actions/member-actions";

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
];

export default function SubPackage({
  packages,
  uid,
}: {
  packages: Package[];
  uid: string;
}) {
  const [open, setOpen] = useState(false);
  const [pkg, setPkg] = useState<Package | null>(null);

  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");

  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  // Reset state when modal opens
  const resetForm = () => {
    setPkg(null);
    setSelectedStartDate("");
    setSelectedEndDate("");
    setSelectedPaymentDate("");
    setSelectedAmount("");
    setSelectedPaymentMethod("CASH");
    setShowEdits(false);
    setPriceChanged(false);
  };

  const toggleOpen = (value: boolean) => {
    setOpen(value);
    if (!value) resetForm();
  };

  const handleStartDate = (date: string) => {
    if (!pkg) return;

    const end = new Date(date);
    end.setDate(end.getDate() + Number(pkg.expiryPeriod));

    setSelectedStartDate(date);
    setSelectedEndDate(end.toISOString());
  };

  useEffect(() => {
    if (!pkg) return;
    setSelectedAmount(pkg.price.toString());
  }, [pkg]);

  useEffect(() => {
    setPriceChanged(selectedAmount !== String(pkg?.price ?? ""));
  }, [selectedAmount, pkg]);

  const initialState = { success: false, errors: null, data: null };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      try {
        const result = await subscribePackageAction(currentState, formData);

        if (result.success) {
          toggleOpen(false);
          return initialState;
        }

        return {
          ...result,
        };
      } catch (error) {
        throw error;
      }
    },
    initialState
  );

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => toggleOpen(true)}>
        Add Package
      </Button>

      <Dialog open={open} onOpenChange={toggleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to a package</DialogTitle>
            <DialogDescription>Select the package details below.</DialogDescription>
          </DialogHeader>

          <form action={formAction}>
            {/* Hidden fields */}
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="pkgId" value={pkg?._id ?? ""} />
            <input type="hidden" name="startDate" value={selectedStartDate} />
            <input type="hidden" name="endDate" value={selectedEndDate} />
            <input type="hidden" name="paymentDate" value={selectedPaymentDate} />
            <input type="hidden" name="amount" value={selectedAmount} />
            <input type="hidden" name="paymentMethod" value={selectedPaymentMethod} />
            <input type="hidden" name="priceChanged" value={String(priceChanged)} />

            {/* Package */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Package</Label>
              <Select
                onValueChange={(value) => setPkg(packages.find((p) => p._id === value) || null)}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg._id} value={pkg._id} className="hover:bg-accent">
                      {`${pkg.name}: ${pkg.numberOfSessions} sessions • EGP${pkg.price}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <PopoverDatePicker
                  className="w-full"
                  selectedDate={selectedStartDate ? new Date(selectedStartDate) : undefined}
                  handleDateChange={handleStartDate}
                  disabled={!pkg}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <PopoverDatePicker
                  className="w-full"
                  selectedDate={selectedEndDate ? new Date(selectedEndDate) : undefined}
                  disabled
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select
                disabled={!selectedStartDate || pending}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
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

            {/* Edit payment details */}
            <div className="flex gap-2 items-center mt-4">
              <Checkbox
                name="showEdits"
                checked={showEdits}
                onCheckedChange={() => setShowEdits((prev) => !prev)}
              />
              <p onClick={() => setShowEdits((prev) => !prev)} className="cursor-pointer">
                Edit payment date or amount
              </p>
            </div>

            {showEdits && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Paid Amount</Label>
                  <Input
                    type="number"
                    className="w-full mt-1"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    disabled={!pkg}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <PopoverDatePicker
                    selectedDate={
                      selectedPaymentDate ? new Date(selectedPaymentDate) : undefined
                    }
                    handleDateChange={setSelectedPaymentDate}
                    className="w-full mt-1"
                    disabled={!pkg}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => toggleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
