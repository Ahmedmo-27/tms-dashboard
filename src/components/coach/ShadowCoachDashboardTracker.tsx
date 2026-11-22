"use client";

import { useEffect, useState, useCallback } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import { getMyShadowChecklist } from "@/lib/data/coach-portal";
import type { MyShadowChecklistDto } from "@/types/coach.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  UserCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Check,
  Info,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ShadowCoachDashboardTrackerProps {
  className?: string;
  isStandalonePage?: boolean;
}

export function ShadowCoachDashboardTracker({
  className,
  isStandalonePage = false,
}: ShadowCoachDashboardTrackerProps) {
  const coachApi = useCoachApi();
  const [data, setData] = useState<MyShadowChecklistDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("p1");

  const fetchChecklist = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const checklist = await getMyShadowChecklist(coachApi);
        setData(checklist);
        if (checklist?.currentPhase) {
          setActiveTab(`p${checklist.currentPhase}`);
        }
      } catch (err: any) {
        console.error("Failed to load shadow coach checklist", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coachApi]
  );

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Loading your shadow training checklist...</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const currentPhase = data.currentPhase || 1;
  const isAllComplete = data.isAllComplete;
  const isGraduated = data.status === "graduated";
  const isCompletedPendingReview = data.status === "completed_pending_review";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hero Banner Card */}
      <Card className="border-l-4 border-l-primary overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold">
                  Shadow Coach Training Tracker
                </CardTitle>

                {/* Phase Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5",
                    currentPhase === 1 && "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40",
                    currentPhase === 2 && "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
                    currentPhase === 3 && "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/40"
                  )}
                >
                  Phase {currentPhase}/3: {data.phaseLabel}
                </Badge>

                {/* Completion Status Badge */}
                {isGraduated ? (
                  <Badge className="bg-emerald-600 text-white text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Promoted to Coach
                  </Badge>
                ) : isCompletedPendingReview ? (
                  <Badge className="bg-emerald-600 text-white text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    Curriculum Completed · Ready for Evaluation
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Month {currentPhase} in Progress
                  </Badge>
                )}
              </div>

              <CardDescription className="text-xs">
                Your lead coaches verify your competencies during classes. Track what has been marked and what remains for this month.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchChecklist(true)}
              disabled={refreshing || loading}
              className="gap-1.5 text-xs h-8 shrink-0 self-start md:self-auto"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh Status
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Progress Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3.5 rounded-lg border">
            {/* Current Month Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  Current Month (Month {currentPhase}) Targets
                </span>
                <span className="font-bold text-foreground">
                  {data.currentMonth?.completedCount} / {data.currentMonth?.totalCount} completed ({data.currentMonth?.progressPercent}%)
                </span>
              </div>
              <Progress value={data.currentMonth?.progressPercent || 0} className="h-2" />
            </div>

            {/* Total 3-Month Program Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Overall 3-Month Curriculum Progress
                </span>
                <span className="font-bold text-foreground">
                  {data.completedCount} / {data.totalCount} completed ({data.progressPercent}%)
                </span>
              </div>
              <Progress value={data.progressPercent || 0} className="h-2" />
            </div>
          </div>

          {/* Guidelines Callout for Active Month */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Guidelines for Month {currentPhase}: {data.currentMonth?.title}</span>
            </div>
            <p className="text-blue-800 dark:text-blue-300/90 leading-relaxed text-[11px] pl-5">
              {data.currentMonth?.guidelines}
            </p>
          </div>

          {/* All 3 Months Tabbed Breakdown */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
            <TabsList className="grid grid-cols-3 w-full">
              {data.phases.map((ph) => {
                const tabVal = `p${ph.phaseNumber}`;
                const isCurrent = ph.phaseNumber === currentPhase;
                return (
                  <TabsTrigger
                    key={ph.phaseNumber}
                    value={tabVal}
                    className="text-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <span>Month {ph.phaseNumber}</span>
                    {ph.isPhaseComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {data.phases.map((ph) => {
              const tabVal = `p${ph.phaseNumber}`;
              const checkedList = ph.checklist.filter((i) => i.isDone);
              const remainingList = ph.checklist.filter((i) => !i.isDone);

              return (
                <TabsContent key={ph.phaseNumber} value={tabVal} className="space-y-4 mt-2">
                  {/* Phase Subtitle & Summary */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <div>
                      <span className="font-semibold text-sm">
                        Month {ph.phaseNumber}: {ph.title}
                      </span>
                      <p className="text-muted-foreground text-[11px]">
                        {ph.guidelines}
                      </p>
                    </div>
                    <Badge
                      variant={ph.isPhaseComplete ? "default" : "outline"}
                      className={cn(
                        "text-[10px] shrink-0",
                        ph.isPhaseComplete && "bg-emerald-600 text-white"
                      )}
                    >
                      {ph.isPhaseComplete
                        ? "Month Completed"
                        : `${ph.done} of ${ph.total} Completed`}
                    </Badge>
                  </div>

                  {/* Two-Column / Split Section for Remaining vs Checked */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Remaining Targets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold px-1">
                        <span className="text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Remaining Targets ({remainingList.length})
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Yet to be verified
                        </span>
                      </div>

                      {remainingList.length === 0 ? (
                        <div className="border border-dashed rounded-lg p-5 text-center bg-emerald-50/20 text-xs text-muted-foreground space-y-1">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                          <p className="font-medium text-foreground">All targets completed!</p>
                          <p className="text-[11px]">
                            You have successfully verified all targets for Month {ph.phaseNumber}.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {remainingList.map((item) => (
                            <div
                              key={item.key}
                              className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors text-xs space-y-1 border-l-2 border-l-amber-500"
                            >
                              <div className="font-medium text-foreground flex items-center justify-between">
                                <span>{item.task || item.title}</span>
                                <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">
                                  Pending
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-muted-foreground text-[11px]">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground/80 italic pt-0.5">
                                Lead coach will check this off when observed in class.
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completed Targets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold px-1">
                        <span className="text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Checked & Verified ({checkedList.length})
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Marked by lead coaches
                        </span>
                      </div>

                      {checkedList.length === 0 ? (
                        <div className="border border-dashed rounded-lg p-5 text-center bg-muted/20 text-xs text-muted-foreground space-y-1">
                          <Clock className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                          <p className="font-medium text-foreground">No targets checked yet</p>
                          <p className="text-[11px]">
                            As your lead coaches observe your performance in class, checked targets will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {checkedList.map((item) => (
                            <div
                              key={item.key}
                              className="p-3 rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1"
                            >
                              <div className="font-medium text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                                  {item.task || item.title}
                                </span>
                                <Badge className="text-[9px] bg-emerald-600 text-white">
                                  Verified
                                </Badge>
                              </div>

                              {item.description && (
                                <p className="text-muted-foreground text-[11px]">
                                  {item.description}
                                </p>
                              )}

                              {item.completedByCoachName && (
                                <div className="text-[10px] text-emerald-800 dark:text-emerald-400 pt-1 flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  <span>Verified by <strong>{item.completedByCoachName}</strong></span>
                                  {item.completedAt && (
                                    <span>
                                      · {format(new Date(item.completedAt), "MMM d, h:mm a")}
                                    </span>
                                  )}
                                </div>
                              )}

                              {item.notes && (
                                <div className="text-[10px] bg-background/80 p-1.5 rounded border text-foreground italic mt-1">
                                  "{item.notes}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
