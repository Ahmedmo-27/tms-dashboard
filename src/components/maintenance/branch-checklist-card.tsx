"use client";

import React, { useState } from "react";
import {
  Droplets,
  Layers,
  Sparkles,
  Dumbbell,
  CheckCircle2,
  Circle,
  FileText,
  User,
  Clock,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MaintenanceCheckItem,
  MaintenanceItemId,
  CurrentSlotData,
} from "@/lib/data/maintenance";
import toast from "react-hot-toast";

interface BranchChecklistCardProps {
  slotData: CurrentSlotData;
  onToggleItem: (
    itemId: MaintenanceItemId,
    newStatus: boolean,
    notes?: string
  ) => Promise<void>;
  onMarkAllComplete: () => Promise<void>;
  isSubmitting?: boolean;
}

const ITEM_CONFIG: Record<
  MaintenanceItemId,
  {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    bgColor: string;
    iconColor: string;
  }
> = {
  showers_bottles: {
    icon: Droplets,
    description:
      "Shampoo, shower gel, and conditioner bottles are full, clean, and neatly aligned.",
    bgColor: "bg-blue-500/10 text-blue-500",
    iconColor: "text-blue-500",
  },
  towels: {
    icon: Layers,
    description:
      "Clean fresh towels are adequately stocked; used towel hamper is tidy and not overflowing.",
    bgColor: "bg-emerald-500/10 text-emerald-500",
    iconColor: "text-emerald-500",
  },
  communal_area: {
    icon: Sparkles,
    description:
      "Lounge, locker area, corridors, and reception are clean, trash-free, and inviting.",
    bgColor: "bg-purple-500/10 text-purple-500",
    iconColor: "text-purple-500",
  },
  gym_prepared: {
    icon: Dumbbell,
    description:
      "All weights racked, machines wiped down, mats sanitized, and floor cleared of obstacles.",
    bgColor: "bg-amber-500/10 text-amber-500",
    iconColor: "text-amber-500",
  },
};

export function BranchChecklistCard({
  slotData,
  onToggleItem,
  onMarkAllComplete,
  isSubmitting = false,
}: BranchChecklistCardProps) {
  const [activeItemForNote, setActiveItemForNote] =
    useState<MaintenanceCheckItem | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleCheckboxClick = async (item: MaintenanceCheckItem) => {
    try {
      setLoadingItemId(item.id);
      await onToggleItem(item.id, !item.isCompleted, item.notes);
      toast.success(
        !item.isCompleted
          ? `Marked "${item.title}" as complete`
          : `Marked "${item.title}" as pending`
      );
    } catch {
      toast.error("Failed to update item. Please try again.");
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleSaveNote = async () => {
    if (!activeItemForNote) return;
    try {
      setLoadingItemId(activeItemForNote.id);
      await onToggleItem(
        activeItemForNote.id,
        activeItemForNote.isCompleted,
        noteInput
      );
      toast.success("Note saved successfully");
      setActiveItemForNote(null);
      setNoteInput("");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setLoadingItemId(null);
    }
  };

  const allCompleted = slotData.completedCount === slotData.totalCount;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
              allCompleted
                ? "bg-emerald-500/15 text-emerald-600"
                : slotData.completedCount > 0
                ? "bg-amber-500/15 text-amber-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {slotData.completedCount}/{slotData.totalCount}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Hourly Space Quality</h3>
              <Badge
                variant={
                  allCompleted
                    ? "default"
                    : slotData.completedCount > 0
                    ? "secondary"
                    : "outline"
                }
                className={
                  allCompleted
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : slotData.completedCount > 0
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    : ""
                }
              >
                {allCompleted
                  ? "Hour Complete 🎉"
                  : slotData.completedCount > 0
                  ? "In Progress"
                  : "Needs Inspection"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {allCompleted
                ? "All checklist items verified for this hour window."
                : "Inspect and check off each section before the hour resets."}
            </p>
          </div>
        </div>

        {!allCompleted && (
          <Button
            onClick={onMarkAllComplete}
            disabled={isSubmitting}
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark All Completed
          </Button>
        )}
      </div>

      {/* 4 Interactive Checklist Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {slotData.items.map((item) => {
          const config = ITEM_CONFIG[item.id];
          const Icon = config.icon;
          const isItemLoading = loadingItemId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => !isItemLoading && handleCheckboxClick(item)}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all hover:shadow-md ${
                item.isCompleted
                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      item.isCompleted
                        ? "bg-emerald-500 text-white"
                        : config.bgColor
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-semibold transition-colors ${
                        item.isCompleted
                          ? "text-emerald-700 line-through dark:text-emerald-300"
                          : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Toggle ${item.title}`}
                  className="shrink-0 p-1 text-muted-foreground transition-transform active:scale-95 group-hover:text-foreground"
                >
                  {isItemLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : item.isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-500/20" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                  )}
                </button>
              </div>

              {/* Attribution & Notes Footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {item.isCompleted ? (
                    <>
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-medium text-foreground">
                        {item.completedByName || "Staff"}
                      </span>
                      {item.completedAt && (
                        <>
                          <span>•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(item.completedAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="italic text-muted-foreground">
                      Pending inspection
                    </span>
                  )}
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveItemForNote(item);
                    setNoteInput(item.notes || "");
                  }}
                  className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  <span>{item.notes ? "Edit note" : "Add note"}</span>
                </div>
              </div>

              {item.notes && (
                <div className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-foreground/90 italic">
                  &ldquo;{item.notes}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note Dialog */}
      <Dialog
        open={Boolean(activeItemForNote)}
        onOpenChange={(open) => !open && setActiveItemForNote(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add / Edit Note: {activeItemForNote?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Add any issue or remark regarding this item (e.g. &apos;Showers 2
              &amp; 3 shampoo bottle pump damaged&apos; or &apos;Laundry
              arrived&apos;):
            </p>
            <Input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Enter operational note..."
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setActiveItemForNote(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
