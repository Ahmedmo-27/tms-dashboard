"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getTicketCategories,
  submitTicket,
  type TicketCategory,
} from "@/lib/data/tickets";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  fetchCategories?: () => Promise<TicketCategory[]>;
  onSubmit?: (payload: {
    category: string;
    description: string;
    otherDetails?: string;
  }) => Promise<void>;
}

export function CreateTicketModal({
  open,
  onOpenChange,
  onCreated,
  fetchCategories = getTicketCategories,
  onSubmit = async (payload) => {
    await submitTicket(payload);
  },
}: CreateTicketModalProps) {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [category, setCategory] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [description, setDescription] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOther = category.toLowerCase() === "other";

  useEffect(() => {
    if (!open) return;
    setIsLoadingCategories(true);
    fetchCategories()
      .then((cats) => {
        const active = cats.filter((c) => c.isActive !== false);
        setCategories(active);
      })
      .catch(() => toast.error("Failed to load ticket categories"))
      .finally(() => setIsLoadingCategories(false));
  }, [open, fetchCategories]);

  useEffect(() => {
    if (!open) {
      setCategory("");
      setOtherDetails("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!category) {
      toast.error("Please choose a problem category");
      return;
    }
    if (isOther && !otherDetails.trim()) {
      toast.error("Please describe your problem in the Other field");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        category,
        description: description.trim(),
        ...(isOther ? { otherDetails: otherDetails.trim() } : {}),
      });
      toast.success("Ticket submitted successfully");
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error("Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Problem Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isLoadingCategories || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingCategories ? "Loading categories..." : "Select a category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div className="space-y-2">
              <Label htmlFor="other-details">Other Details</Label>
              <Input
                id="other-details"
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                placeholder="Describe the problem type"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail"
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
