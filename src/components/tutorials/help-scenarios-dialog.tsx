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
  Sparkles,
  Layers,
  Compass,
  CheckCircle2,
} from "lucide-react";

export function HelpScenariosDialog() {
  const pathname = usePathname();
  const { isHelpModalOpen, closeHelpModal, startTutorial } = useWalkthrough();
  const user = useAppSelector((state) => state.auth.user);
  const coachRole = useAppSelector((state) => state.coach.role);

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
        const scenarios = section.scenarios.filter((scenario) => {
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
          } else {
            // Staff portal: skip coach-only scenarios
            const isStaffScenario = scenario.roles.some(
              (r) => r === "branch_admin" || r === "management"
            );
            if (!isStaffScenario) return false;
          }

          // Specific tab role filter
          if (
            selectedRoleFilter !== "all" &&
            !scenario.roles.includes(selectedRoleFilter)
          ) {
            return false;
          }

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
  }, [searchQuery, selectedRoleFilter, isCoachPortal, coachRole]);

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
    : staffRole === "management"
    ? "Management Portal"
    : "Branch Admin Portal";

  const portalDescription = isCoachPortal
    ? "Interactive step-by-step guides for your daily schedule, PT clients, session attendance, and check-in radar."
    : "Step-by-step interactive walkthroughs for gym operations, member onboarding, scheduling, POS, and management.";

  const searchPlaceholder = isCoachPortal
    ? "Search coach guides (e.g. attendance confirmation, deduct PT, schedule, scans, tickets)..."
    : "Search functionalities (e.g. add package, guest package, subscribe to open gym, refund, schedule)...";

  return (
    <Dialog open={isHelpModalOpen} onOpenChange={(open) => !open && closeHelpModal()}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-border bg-background shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  Tutorials & Interactive Guides
                </DialogTitle>
                <Badge variant="secondary" className="text-xs capitalize font-mono">
                  {portalBadge}
                </Badge>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {portalDescription}
              </DialogDescription>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Tabs
              value={selectedRoleFilter}
              onValueChange={(val) => setSelectedRoleFilter(val as "all" | TutorialRole)}
              className="w-full sm:w-auto"
            >
              {isCoachPortal ? (
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs">
                    All Guides
                  </TabsTrigger>
                  <TabsTrigger value="coach" className="text-xs">
                    Coach
                  </TabsTrigger>
                  {coachRole === "managing_coach" && (
                    <TabsTrigger value="managing_coach" className="text-xs">
                      Managing
                    </TabsTrigger>
                  )}
                </TabsList>
              ) : (
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="branch_admin" className="text-xs">
                    Branch Admin
                  </TabsTrigger>
                  <TabsTrigger value="management" className="text-xs">
                    Management
                  </TabsTrigger>
                </TabsList>
              )}
            </Tabs>
          </div>
        </DialogHeader>

        {/* Scenarios List */}
        <ScrollArea className="flex-1 p-6 overflow-y-auto">
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
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary" />
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
    <div className="group relative flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-accent/40 transition-all duration-200 shadow-sm">
      <div className="flex items-start gap-3.5 min-w-0 flex-1 pr-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
          {IconComponent && <IconComponent className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-semibold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
              {scenario.title}
            </h5>
            {scenario.badge && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary bg-primary/5"
              >
                {scenario.badge}
              </Badge>
            )}
            {scenario.roles.includes("management") && !scenario.roles.includes("branch_admin") && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                Mgmt Only
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {scenario.subtitle}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
            <span className="font-mono">{scenario.steps.length} interactive steps</span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        onClick={onStart}
        className="shrink-0 gap-1.5 h-8 px-3 text-xs font-semibold shadow-sm group-hover:bg-primary group-hover:text-primary-foreground"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Start Tour
      </Button>
    </div>
  );
}
