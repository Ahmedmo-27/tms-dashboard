"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useCoachApi } from "@/hooks/useCoachApi";
import {
  CheckCircle2,
  Circle,
  Loader2,
  UserCheck,
  AlertCircle,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ShadowCoachChecklistModalProps {
  scheduledClassId: string | null;
  classTitle?: string;
  shadowCoachName?: string;
  open: boolean;
  onClose: () => void;
}

export function ShadowCoachChecklistModal({
  scheduledClassId,
  classTitle,
  shadowCoachName,
  open,
  onClose,
}: ShadowCoachChecklistModalProps) {
  const coachApi = useCoachApi();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("p1");

  useEffect(() => {
    if (!open || !scheduledClassId) return;

    let cancelled = false;
    const fetchChecklist = async () => {
      setLoading(true);
      try {
        const res = await coachApi.get(
          `/api/coach/classes/${scheduledClassId}/shadow-checklist`
        );
        if (!cancelled && res.data?.data) {
          setData(res.data.data);
          const currentPhase = res.data.data.progress?.currentPhase || 1;
          setActiveTab(`p${currentPhase}`);
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err.response?.data?.message || "Failed to load shadow coach checklist";
          toast.error(msg);
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchChecklist();
    return () => {
      cancelled = true;
    };
  }, [open, scheduledClassId, coachApi, onClose]);

  const handleToggleItem = async (itemKey: string, currentStatus: boolean) => {
    if (!scheduledClassId) return;
    setUpdatingKey(itemKey);
    try {
      const res = await coachApi.patch(
        `/api/coach/classes/${scheduledClassId}/shadow-checklist`,
        {
          itemKey,
          isDone: !currentStatus,
        }
      );
      if (res.data?.data) {
        setData((prev: any) => ({
          ...prev,
          progress: res.data.data,
        }));
        toast.success(!currentStatus ? "Checklist item marked as completed" : "Checklist item unmarked");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update checklist item";
      toast.error(msg);
    } finally {
      setUpdatingKey(null);
    }
  };

  const progress = data?.progress;
  const shadowCoach = data?.shadowCoach;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Shadow Coach Targets</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {classTitle ? `${classTitle} • ` : ""}
                Candidate: <strong className="text-foreground">{shadowCoach?.name || shadowCoachName}</strong>
              </DialogDescription>
            </div>

            {shadowCoach && (
              <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary">
                {shadowCoach.phaseLabel || `Phase ${shadowCoach.currentPhase}/3`}
              </Badge>
            )}
          </div>

          {progress && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">3-Month Program Overall Progress</span>
                <span className="font-semibold text-foreground">
                  {progress.completedCount} of {progress.totalCount} completed ({progress.progressPercent}%)
                </span>
              </div>
              <Progress value={progress.progressPercent} className="h-2" />
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading shadow coach targets...</p>
          </div>
        ) : progress ? (
          <div className="flex-1 flex flex-col min-h-0 p-6 pt-4">
            {progress.isAllComplete && (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Training Completed!</strong> All tasks across Months 1, 2, and 3 have been completed.
                  Awaiting Managing Coach promotion review.
                </span>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="p1" className="text-xs">
                  Month 1: Observe
                </TabsTrigger>
                <TabsTrigger value="p2" className="text-xs">
                  Month 2: Assist
                </TabsTrigger>
                <TabsTrigger value="p3" className="text-xs">
                  Month 3: Lead
                </TabsTrigger>
              </TabsList>

              {progress.phases?.map((ph: any) => {
                const tabVal = `p${ph.phaseNumber}`;
                const isCurrentCandidatePhase = progress.currentPhase === ph.phaseNumber;

                return (
                  <TabsContent
                    key={ph.phaseNumber}
                    value={tabVal}
                    className="flex-1 flex flex-col min-h-0 focus-visible:outline-none data-[state=inactive]:hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Phase {ph.phaseNumber}/3: {ph.title}
                        </span>
                        {isCurrentCandidatePhase && (
                          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                            Current Candidate Phase
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {ph.done} / {ph.total} done
                      </span>
                    </div>

                    {ph.guidelines && (
                      <div className="mb-3 rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span>{ph.guidelines}</span>
                      </div>
                    )}

                    <ScrollArea className="flex-1 pr-3">
                      <div className="space-y-2.5">
                        {ph.checklist?.map((item: any) => {
                          const isUpdating = updatingKey === item.key;
                          return (
                            <div
                              key={item.key}
                              onClick={() => !isUpdating && handleToggleItem(item.key, item.isDone)}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                item.isDone
                                  ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10"
                                  : "bg-card hover:bg-accent/40 border-border/80"
                              )}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                  <Checkbox
                                    checked={item.isDone}
                                    onCheckedChange={() => handleToggleItem(item.key, item.isDone)}
                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                  />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-sm font-medium leading-snug",
                                    item.isDone ? "text-foreground line-through opacity-85" : "text-foreground"
                                  )}
                                >
                                  {item.task}
                                </p>

                                {item.isDone && (
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Done
                                    </span>
                                    {item.completedByCoachName && (
                                      <span>• Verified by {item.completedByCoachName}</span>
                                    )}
                                    {item.completedAt && (
                                      <span>• {format(new Date(item.completedAt), "MMM d, yyyy")}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Badge
                                variant={item.isDone ? "default" : "secondary"}
                                className={cn(
                                  "text-[10px] shrink-0 font-normal",
                                  item.isDone
                                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {item.isDone ? "Completed" : "Remaining"}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
