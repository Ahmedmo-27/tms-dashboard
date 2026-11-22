"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import {
  ShadowCoachSummaryDto,
  ShadowCoachProgressDto,
  ShadowPhaseDto,
  ShadowChecklistItemDto,
} from "@/types/coach.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Eye,
  UserCheck,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Loader2,
  Calendar,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AssignCandidateToClassModal } from "./AssignCandidateToClassModal";

export function ShadowCoachesManagement() {
  const coachApi = useCoachApi();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidates, setCandidates] = useState<ShadowCoachSummaryDto[]>([]);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  // Detail Modal State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ShadowCoachSummaryDto | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<ShadowCoachProgressDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeCurriculumTab, setActiveCurriculumTab] = useState<string>("p1");

  // Evaluation Modal State
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalCandidate, setEvalCandidate] = useState<ShadowCoachSummaryDto | null>(null);
  const [evalDecision, setEvalDecision] = useState<"promote" | "retain">("promote");
  const [evalNotes, setEvalNotes] = useState("");
  const [submittingEval, setSubmittingEval] = useState(false);

  // Assign to Class Modal State
  const [assignClassOpen, setAssignClassOpen] = useState(false);
  const [assignCandidate, setAssignCandidate] = useState<ShadowCoachSummaryDto | null>(null);

  const handleOpenAssignClass = (candidate: ShadowCoachSummaryDto) => {
    setAssignCandidate(candidate);
    setAssignClassOpen(true);
  };

  // Phase Changing State
  const [updatingPhaseId, setUpdatingPhaseId] = useState<string | null>(null);

  const fetchCandidates = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        let res;
        try {
          res = await coachApi.get("/api/coach/managing/shadow-coaches");
        } catch (err: any) {
          if (err.response?.status === 403 || err.response?.status === 404) {
            res = await coachApi.get("/api/admin/shadow-coaches");
          } else {
            throw err;
          }
        }

        if (res.data?.success && Array.isArray(res.data.data)) {
          setCandidates(res.data.data);
        } else if (Array.isArray(res.data)) {
          setCandidates(res.data);
        }
      } catch (err: any) {
        console.error("Failed to load shadow coaches", err);
        toast.error("Failed to load shadow coaches list");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coachApi]
  );

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // View Curriculum Detail
  const handleOpenDetail = async (candidate: ShadowCoachSummaryDto) => {
    setSelectedCandidate(candidate);
    setDetailOpen(true);
    setDetailLoading(true);
    setActiveCurriculumTab(`p${candidate.currentPhase || 1}`);

    try {
      const res = await coachApi.get(`/api/coach/managing/shadow-coaches/${candidate.coachId}`);
      if (res.data?.success && res.data.data) {
        setCandidateDetail(res.data.data);
      } else if (res.data?._id) {
        setCandidateDetail(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load candidate details", err);
      toast.error("Failed to load candidate curriculum details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Evaluation Modal
  const handleOpenEvaluation = (candidate: ShadowCoachSummaryDto) => {
    setEvalCandidate(candidate);
    setEvalDecision("promote");
    setEvalNotes("");
    setEvalOpen(true);
  };

  // Submit Evaluation Decision
  const handleSubmitEvaluation = async () => {
    if (!evalCandidate) return;
    setSubmittingEval(true);
    try {
      const res = await coachApi.post(
        `/api/coach/managing/shadow-coaches/${evalCandidate.coachId}/decision`,
        {
          decision: evalDecision,
          notes: evalNotes.trim(),
        }
      );

      if (res.data?.success) {
        toast.success(
          evalDecision === "promote"
            ? `${evalCandidate.coachName} has been promoted to Coach!`
            : `${evalCandidate.coachName} was retained as Shadow Coach`
        );
        setEvalOpen(false);
        fetchCandidates(true);
      } else {
        toast.error(res.data?.message || "Failed to submit evaluation");
      }
    } catch (err: any) {
      console.error("Evaluation error", err);
      toast.error(err.response?.data?.message || "Error submitting evaluation decision");
    } finally {
      setSubmittingEval(false);
    }
  };

  // Change Phase Manually
  const handleChangePhase = async (coachId: string, newPhase: number) => {
    setUpdatingPhaseId(coachId);
    try {
      const res = await coachApi.patch(
        `/api/coach/managing/shadow-coaches/${coachId}/phase`,
        { phase: newPhase }
      );
      if (res.data?.success) {
        toast.success(`Phase updated to Month ${newPhase}`);
        fetchCandidates(true);
        if (selectedCandidate && selectedCandidate.coachId === coachId) {
          handleOpenDetail(selectedCandidate);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update phase");
    } finally {
      setUpdatingPhaseId(null);
    }
  };

  // Filter & Search Logic
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.coachName.toLowerCase().includes(search.toLowerCase()) ||
        (c.phoneNumber && c.phoneNumber.includes(search));

      if (!matchesSearch) return false;

      if (filterTab === "all") return true;
      if (filterTab === "in_training")
        return c.status === "in_progress";
      if (filterTab === "ready_eval")
        return c.isCompleted || c.status === "completed_pending_review";
      if (filterTab === "promoted") return c.status === "promoted";
      if (filterTab === "retained") return c.status === "retained";

      return true;
    });
  }, [candidates, search, filterTab]);

  // Metric counts
  const readyForEvalCount = candidates.filter(
    (c) => c.isCompleted || c.status === "completed_pending_review"
  ).length;
  const inTrainingCount = candidates.filter((c) => c.status === "in_progress").length;
  const phase1Count = candidates.filter(
    (c) => c.currentPhase === 1 && c.status === "in_progress"
  ).length;
  const phase2Count = candidates.filter(
    (c) => c.currentPhase === 2 && c.status === "in_progress"
  ).length;
  const phase3Count = candidates.filter(
    (c) => c.currentPhase === 3 && c.status === "in_progress"
  ).length;
  const promotedCount = candidates.filter((c) => c.status === "promoted").length;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Shadow Coaches Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Supervise the 3-month shadow coach curriculum, track phase milestones, and make graduation decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCandidates(true)}
            disabled={refreshing || loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", (refreshing || loading) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="text-xs font-medium text-muted-foreground">In Training</div>
          <div className="text-2xl font-bold mt-1">{inTrainingCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Active apprentices
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-xs font-medium text-muted-foreground">Month 1 (Observe)</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{phase1Count}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Setup & welcome
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs font-medium text-muted-foreground">Month 2 (Assist)</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{phase2Count}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Demonstrations
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="text-xs font-medium text-muted-foreground">Month 3 (Lead)</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">{phase3Count}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Supervised coaching
          </div>
        </Card>

        <Card
          className={cn(
            "p-4 border-l-4 col-span-2 md:col-span-1",
            readyForEvalCount > 0
              ? "border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
              : "border-l-zinc-300"
          )}
        >
          <div className="text-xs font-medium text-muted-foreground flex items-center justify-between">
            <span>Ready for Evaluation</span>
            {readyForEvalCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div
            className={cn(
              "text-2xl font-bold mt-1",
              readyForEvalCount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""
            )}
          >
            {readyForEvalCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Completed all checklists
          </div>
        </Card>
      </div>

      {/* Main List & Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Shadow Candidates Directory</CardTitle>
              <CardDescription>
                Lead coaches mark training items during shared sessions. You evaluate and promote upon completion.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by coach name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="pt-2">
            <Tabs value={filterTab} onValueChange={setFilterTab}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto h-auto p-1">
                <TabsTrigger value="all" className="text-xs py-1.5">
                  All ({candidates.length})
                </TabsTrigger>
                <TabsTrigger value="in_training" className="text-xs py-1.5">
                  In Training ({inTrainingCount})
                </TabsTrigger>
                <TabsTrigger value="ready_eval" className="text-xs py-1.5 flex items-center gap-1">
                  Ready for Review
                  {readyForEvalCount > 0 && (
                    <Badge variant="default" className="h-4 px-1 text-[10px] bg-emerald-600">
                      {readyForEvalCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="promoted" className="text-xs py-1.5">
                  Promoted ({promotedCount})
                </TabsTrigger>
                <TabsTrigger value="retained" className="text-xs py-1.5">
                  Retained ({candidates.filter((c) => c.status === "retained").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading shadow coaches...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 stroke-1" />
              <p className="text-base font-medium">No shadow coaches found</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {search
                  ? "No results matching your search query."
                  : "No shadow coaches registered in this category. You can add shadow coaches via Accounts Management."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-md border">
              {filteredCandidates.map((c) => {
                const isReady = c.isCompleted || c.status === "completed_pending_review";
                const isPromoted = c.status === "promoted";
                const isRetained = c.status === "retained";

                return (
                  <div
                    key={c.coachId}
                    className={cn(
                      "p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors",
                      isReady ? "bg-emerald-50/30 dark:bg-emerald-950/10" : "hover:bg-muted/40"
                    )}
                  >
                    {/* Left: Info & Phase */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base">{c.coachName}</span>
                        {c.phoneNumber && (
                          <span className="text-xs text-muted-foreground">({c.phoneNumber})</span>
                        )}

                        {/* Phase Badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium",
                            c.currentPhase === 1 && "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40",
                            c.currentPhase === 2 && "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
                            c.currentPhase === 3 && "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/40"
                          )}
                        >
                          Phase {c.currentPhase}/3: {c.phaseLabel}
                        </Badge>

                        {/* Status Badge */}
                        {isReady && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            Ready for Decision
                          </Badge>
                        )}
                        {isPromoted && (
                          <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Promoted to Coach
                          </Badge>
                        )}
                        {isRetained && (
                          <Badge variant="outline" className="border-zinc-400 text-zinc-700 bg-zinc-50 text-xs">
                            Retained in Program
                          </Badge>
                        )}
                      </div>

                      {/* Progress bar & counts */}
                      <div className="flex items-center gap-3 pt-1 max-w-md">
                        <Progress value={c.progressPercent} className="h-2 flex-1" />
                        <span className="text-xs font-semibold tabular-nums min-w-10">
                          {c.progressPercent}%
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({c.completedCount}/{c.totalCount} completed)
                        </span>
                      </div>

                      {/* Timeline dates */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                          Started:{" "}
                          {c.startDate ? format(new Date(c.startDate), "MMM d, yyyy") : "N/A"}
                        </span>
                        {c.completedDate && (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed: {format(new Date(c.completedDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {c.reviewedAt && (
                          <span className="text-xs text-muted-foreground">
                            Reviewed: {format(new Date(c.reviewedAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                      {/* Phase Shift dropdown buttons */}
                      {!isPromoted && (
                        <div className="flex items-center border rounded-md p-0.5 bg-muted/30 text-xs">
                          <span className="text-[11px] text-muted-foreground px-1.5 font-medium">Phase:</span>
                          {[1, 2, 3].map((pNum) => (
                            <button
                              key={pNum}
                              type="button"
                              disabled={updatingPhaseId === c.coachId}
                              onClick={() => handleChangePhase(c.coachId, pNum)}
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded transition-all",
                                c.currentPhase === pNum
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              title={`Set Phase ${pNum}`}
                            >
                              {pNum}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* View Curriculum Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(c)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Checklist
                      </Button>

                      {/* Assign to Class Action */}
                      {!isPromoted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignClass(c)}
                          className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Assign to Class
                        </Button>
                      )}

                      {/* Evaluate Candidate Action */}
                      {isReady && !isPromoted && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenEvaluation(c)}
                          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          <Award className="h-3.5 w-3.5" />
                          Evaluate Candidate
                        </Button>
                      )}

                      {/* If already evaluated or in training, still allow reviewing decision if managing coach needs */}
                      {(!isReady || isPromoted || isRetained) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEvaluation(c)}
                          className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {isPromoted || isRetained ? "Re-evaluate" : "Decision"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Curriculum Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {selectedCandidate?.coachName} — Training Curriculum
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Comprehensive 3-phase training program and itemized monthly target checklist.
                </DialogDescription>
              </div>

              {selectedCandidate && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    selectedCandidate.currentPhase === 1 && "border-blue-400 text-blue-700",
                    selectedCandidate.currentPhase === 2 && "border-amber-400 text-amber-700",
                    selectedCandidate.currentPhase === 3 && "border-purple-400 text-purple-700"
                  )}
                >
                  Current: Phase {selectedCandidate.currentPhase}/3
                </Badge>
              )}
            </div>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading curriculum checklist...</p>
            </div>
          ) : candidateDetail ? (
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Overall Progress Summary */}
              <div className="bg-muted/50 p-3.5 rounded-lg border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Program Completion Status</span>
                  <span className="font-bold">
                    {candidateDetail.status === "completed_pending_review"
                      ? "Checklist 100% Completed"
                      : candidateDetail.status === "promoted"
                      ? "Graduated / Promoted"
                      : "In Training"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Candidate started on{" "}
                  {candidateDetail.startDate
                    ? format(new Date(candidateDetail.startDate), "MMMM d, yyyy")
                    : "N/A"}
                  {candidateDetail.reviewNotes && (
                    <div className="mt-1 p-2 bg-background rounded border text-[11px] text-foreground font-mono">
                      <strong>Notes:</strong> {candidateDetail.reviewNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs for Month 1, 2, 3 */}
              <Tabs
                value={activeCurriculumTab}
                onValueChange={setActiveCurriculumTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid grid-cols-3 w-full">
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

                <ScrollArea className="flex-1 mt-3 pr-3">
                  {candidateDetail.phases?.map((phase) => {
                    const tabKey = `p${phase.phaseNumber}`;
                    return (
                      <TabsContent
                        key={phase.phaseNumber}
                        value={tabKey}
                        className="space-y-4 mt-0"
                      >
                        {/* Phase Header */}
                        <div className="border rounded-lg p-3.5 bg-card space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">
                              Month {phase.phaseNumber}: {phase.title}
                            </h4>
                            {phase.isCompleted ? (
                              <Badge className="bg-emerald-600 text-[10px] text-white gap-1">
                                <Check className="h-3 w-3" /> Month Complete
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                In Progress
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{phase.guideline}</p>
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Monthly Target Checklist
                          </h5>
                          {phase.checklist?.map((item: any) => (
                            <div
                              key={item.key}
                              className={cn(
                                "p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors",
                                item.isDone
                                  ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                                  : "bg-card"
                              )}
                            >
                              <div className="mt-0.5">
                                {item.isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground/60" />
                                )}
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="font-medium text-foreground flex items-center justify-between">
                                  <span>{item.title}</span>
                                  {item.isDone && (
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                      Done
                                    </span>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-[11px]">
                                  {item.description}
                                </p>

                                {item.isDone && item.markedByCoachName && (
                                  <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1.5">
                                    <UserCheck className="h-3 w-3 text-emerald-600" />
                                    Marked by <strong>{item.markedByCoachName}</strong>
                                    {item.markedAt && (
                                      <span>
                                        on {format(new Date(item.markedAt), "MMM d, yyyy h:mm a")}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {item.notes && (
                                  <div className="text-[10px] bg-muted/60 p-1.5 rounded mt-1 italic text-foreground">
                                    "{item.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    );
                  })}
                </ScrollArea>
              </Tabs>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No details found</p>
          )}

          <DialogFooter className="mt-4 pt-3 border-t flex sm:justify-between items-center">
            {selectedCandidate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailOpen(false);
                  handleOpenEvaluation(selectedCandidate);
                }}
                className="gap-1.5 text-xs"
              >
                <Award className="h-3.5 w-3.5" />
                Proceed to Decision
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Decision Modal */}
      <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Evaluate Candidate — {evalCandidate?.coachName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              As managing coach, evaluate whether this shadow coach graduates to full Coach status or remains in the training program.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Candidate Summary Card */}
            <div className="p-3 bg-muted/50 rounded-lg border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidate:</span>
                <span className="font-semibold">{evalCandidate?.coachName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Checklist Progress:</span>
                <span className="font-semibold text-emerald-600">
                  {evalCandidate?.completedCount} / {evalCandidate?.totalCount} items completed ({evalCandidate?.progressPercent}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Phase:</span>
                <span className="font-semibold">Phase {evalCandidate?.currentPhase}/3</span>
              </div>
            </div>

            {/* Decision Radio Choice */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Managing Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEvalDecision("promote")}
                  className={cn(
                    "p-3 rounded-lg border text-left space-y-1 transition-all",
                    evalDecision === "promote"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      Promote to Coach
                    </span>
                    {evalDecision === "promote" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Role transfers to full Coach. Can independently lead scheduled classes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEvalDecision("retain")}
                  className={cn(
                    "p-3 rounded-lg border text-left space-y-1 transition-all",
                    evalDecision === "retain"
                      ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Retain as Shadow
                    </span>
                    {evalDecision === "retain" && (
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Remains in shadow training program for further mentorship and evaluation.
                  </p>
                </button>
              </div>
            </div>

            {/* Notes input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Evaluation Notes / Feedback (Optional)
              </label>
              <Textarea
                placeholder="E.g., Demonstrated excellent crowd control and warm-up pacing throughout Month 3..."
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEvalOpen(false)}
              disabled={submittingEval}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitEvaluation}
              disabled={submittingEval}
              className={cn(
                "gap-2 text-xs",
                evalDecision === "promote"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              )}
            >
              {submittingEval && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {evalDecision === "promote" ? "Confirm Promotion to Coach" : "Confirm Retention as Shadow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignCandidateToClassModal
        open={assignClassOpen}
        onClose={() => setAssignClassOpen(false)}
        candidate={assignCandidate}
        onSuccess={() => fetchCandidates(true)}
      />
    </div>
  );
}
