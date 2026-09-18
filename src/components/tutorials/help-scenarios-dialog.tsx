"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";
import {
  tutorialSections,
  TutorialScenario,
  TutorialRole,
} from "@/lib/tutorials/tutorial-data";
import { useWalkthrough } from "@/lib/tutorials/walkthrough-context";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole, PermissionRole } from "@/lib/config/roles";
import {
  Search,
  Play,
  Layers,
  Compass,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export function HelpScenariosDialog() {
  const pathname = usePathname();
  const { isHelpModalOpen, closeHelpModal, startTutorial } = useWalkthrough();
  const user = useAppSelector((state) => state.auth.user);
  const coachState = useAppSelector((state) => state.coach);
  const coachRole = coachState.role;
  const hasPtSessions = coachState.hasPtSessions;

  const isCoachPortal = pathname?.startsWith("/coach") || Boolean(coachRole && !user);
  const staffRole: PermissionRole = toPermissionRole(user?.role as string | undefined) ?? "branch_admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | TutorialRole>("all");

  // Reset role filter when portal changes
  useEffect(() => {
    setSelectedRoleFilter("all");
  }, [isCoachPortal]);

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tutorialSections
      .map((section) => {
        const scenarios = section.scenarios
          .filter((scenario) => {
            // Portal scope filtering: coach portal only shows coach scenarios; staff portal only shows staff scenarios
            const isCoachScenario = scenario.roles.some(
              (r) => r === "coach" || r === "managing_coach"
            );

            if (isCoachPortal) {
              if (!isCoachScenario) return false;
              // Regular coaches cannot see managing_coach only scenarios
              if (coachRole !== "managing_coach" && !scenario.roles.includes("coach")) {
                return false;
              }
              // Coaches who don't have PT packages don't see PT tutorials
              if (!hasPtSessions && (scenario.requiresPt || scenario.badge === "Personal Training")) {
                return false;
              }
            } else {
              // Staff portal: skip coach-only scenarios
              const isStaffScenario = scenario.roles.some(
                (r) => r === "branch_admin" || r === "management" || r === "mailer"
              );
              if (!isStaffScenario) return false;

              // Mailer users only see scenarios they have permissions for
              if (staffRole === "mailer" && !scenario.roles.includes("mailer")) {
                return false;
              }
            }

            // Specific tab role filter
            if (
              selectedRoleFilter !== "all" &&
              !scenario.roles.includes(selectedRoleFilter)
            ) {
              return false;
            }

            return true;
          })
          .map((scenario) => {
            if (isCoachPortal && !hasPtSessions) {
              const adaptedSteps = scenario.steps.filter((s) => !s.requiresPt);
              let adaptedSubtitle = scenario.subtitle;
              if (scenario.id === "coach-today-overview") {
                adaptedSubtitle = "Quick access to next session, daily timetable, and scan totals";
              } else if (scenario.id === "coach-scans-radar") {
                adaptedSubtitle = "Real-time turnstile socket updates and member phone peeks";
              }
              return {
                ...scenario,
                subtitle: adaptedSubtitle,
                steps: adaptedSteps,
              };
            }
            return scenario;
          })
          .filter((scenario) => {
            // Search query filter
            if (!query) return true;
            const matchTitle = scenario.title.toLowerCase().includes(query);
            const matchSubtitle = scenario.subtitle.toLowerCase().includes(query);
            const matchKeywords =
              scenario.keywords?.some(
                (kw) =>
                  kw.toLowerCase().includes(query) ||
                  query.includes(kw.toLowerCase())
              ) ?? false;
            const matchSteps = scenario.steps.some(
              (s) =>
                s.title.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query)
            );
            return matchTitle || matchSubtitle || matchKeywords || matchSteps;
          });

        return {
          ...section,
          scenarios,
        };
      })
      .filter((section) => section.scenarios.length > 0);
  }, [searchQuery, selectedRoleFilter, isCoachPortal, coachRole, hasPtSessions, staffRole]);

  const totalScenariosCount = useMemo(() => {
    return filteredSections.reduce((acc, sec) => acc + sec.scenarios.length, 0);
  }, [filteredSections]);

  const handleStart = (scenarioId: string) => {
    closeHelpModal();
    startTutorial(scenarioId);
  };

  const portalBadge = isCoachPortal
    ? coachRole === "managing_coach"
      ? "Managing Coach Portal"
      : "Coach Portal"
    : staffRole === "mailer"
    ? "Mailing & Communications Portal"
    : staffRole === "management"
    ? "Management Portal"
    : "Branch Admin Portal";

  const portalDescription = isCoachPortal
    ? hasPtSessions
      ? "Interactive step-by-step guides for your daily schedule, PT clients, session attendance, and check-in radar."
      : "Interactive step-by-step guides for your daily schedule, session attendance, and check-in radar."
    : staffRole === "mailer"
    ? "Step-by-step interactive walkthroughs for composing emails, managing your connected mailbox, and tracking sent delivery logs."
    : "Step-by-step interactive walkthroughs for gym operations, member onboarding, scheduling, POS, and management.";

  const searchPlaceholder = isCoachPortal
    ? hasPtSessions
      ? "Search coach guides (e.g. attendance confirmation, deduct PT, schedule, scans, tickets)..."
      : "Search coach guides (e.g. attendance confirmation, schedule, scans, tickets)..."
    : staffRole === "mailer"
    ? "Search email guides (e.g. compose, broadcast, templates, sync inbox, sent logs)..."
    : "Search functionalities (e.g. add package, guest package, subscribe to open gym, refund, schedule)...";

  return (
    <Dialog open={isHelpModalOpen} onOpenChange={(open) => !open && closeHelpModal()}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl h-[92dvh] sm:h-[750px] max-h-[92dvh] sm:max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border shadow-2xl rounded-2xl sm:rounded-xl">
        {/* Header Bar */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b bg-muted/20 shrink-0 pr-12 sm:pr-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 mb-1 sm:mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-md bg-primary/10 text-primary shrink-0">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-xl font-bold truncate">
                  Interactive System Guides
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                  {portalDescription}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Badge variant="secondary" className="text-[11px] sm:text-xs font-semibold">
                {portalBadge}
              </Badge>
              <Badge variant="outline" className="text-[11px] sm:text-xs font-normal">
                {totalScenariosCount} Guides
              </Badge>
            </div>
          </div>

          {/* Search Bar & Role Tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isCoachPortal ? "Search coach guides..." : "Search functionalities..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8.5 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
              <Tabs
                value={selectedRoleFilter}
                onValueChange={(val) => setSelectedRoleFilter(val as "all" | TutorialRole)}
                className="w-full sm:w-auto"
              >
                {isCoachPortal ? (
                  <TabsList className="h-8.5 sm:h-9 w-full sm:w-auto flex min-w-max sm:min-w-0 p-1 justify-start">
                    <TabsTrigger value="all" className="text-xs px-2.5 py-1 shrink-0">
                      All Guides
                    </TabsTrigger>
                    <TabsTrigger value="coach" className="text-xs px-2.5 py-1 shrink-0">
                      Coach
                    </TabsTrigger>
                    {coachRole === "managing_coach" && (
                      <TabsTrigger value="managing_coach" className="text-xs px-2.5 py-1 shrink-0">
                        Managing
                      </TabsTrigger>
                    )}
                  </TabsList>
                ) : staffRole === "mailer" ? (
                  <TabsList className="h-8.5 sm:h-9 w-full sm:w-auto flex min-w-max sm:min-w-0 p-1 justify-start">
                    <TabsTrigger value="all" className="text-xs px-2.5 py-1 shrink-0">
                      All Guides
                    </TabsTrigger>
                    <TabsTrigger value="mailer" className="text-xs px-2.5 py-1 shrink-0">
                      Mailing
                    </TabsTrigger>
                  </TabsList>
                ) : (
                  <TabsList className="h-8.5 sm:h-9 w-full sm:w-auto flex min-w-max sm:min-w-0 p-1 justify-start">
                    <TabsTrigger value="all" className="text-xs px-2.5 py-1 shrink-0">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="branch_admin" className="text-xs px-2.5 py-1 shrink-0">
                      Branch Admin
                    </TabsTrigger>
                    <TabsTrigger value="management" className="text-xs px-2.5 py-1 shrink-0">
                      Management
                    </TabsTrigger>
                    <TabsTrigger value="mailer" className="text-xs px-2.5 py-1 shrink-0">
                      Mailing
                    </TabsTrigger>
                  </TabsList>
                )}
              </Tabs>
            </div>
          </div>
        </DialogHeader>

        {/* Scenarios List */}
        <ScrollArea className="flex-1 p-3.5 sm:p-6 overflow-y-auto">
          {filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Compass className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-semibold text-sm">No tutorials match your search</p>
              <p className="text-xs mt-1">Try searching for different keywords or resetting filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      {section.title}
                    </h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      {section.scenarios.length} {section.scenarios.length === 1 ? "guide" : "guides"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {section.scenarios.map((scenario) => (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        onStart={() => handleStart(scenario.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            Showing {totalScenariosCount} interactive walkthroughs
          </span>
          <span className="hidden sm:inline">Press Esc anytime during a walkthrough to exit</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScenarioCard({
  scenario,
  onStart,
}: {
  scenario: TutorialScenario;
  onStart: () => void;
}) {
  const IconComponent = scenario.icon;

  return (
    <div
      onClick={onStart}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-accent/40 transition-all duration-200 shadow-sm cursor-pointer gap-2.5 sm:gap-3"
    >
      <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-0 sm:pr-3">
        <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
          {IconComponent && <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h5 className="font-semibold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
              {scenario.title}
            </h5>
            {scenario.badge && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary bg-primary/5 shrink-0"
              >
                {scenario.badge}
              </Badge>
            )}
            {scenario.roles.includes("management") && !scenario.roles.includes("branch_admin") && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono shrink-0">
                Mgmt Only
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {scenario.subtitle}
          </p>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
            <span className="font-mono">{scenario.steps.length} interactive steps</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t border-border/40 sm:border-0 shrink-0">
        <span className="sm:hidden text-[11px] text-muted-foreground font-mono">
          {scenario.steps.length} steps
        </span>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          className="gap-1.5 h-7.5 sm:h-8 px-3 text-xs font-semibold shadow-sm group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Start Tour
        </Button>
      </div>
    </div>
  );
}
