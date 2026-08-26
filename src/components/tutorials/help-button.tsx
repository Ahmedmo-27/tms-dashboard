"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useWalkthrough } from "@/lib/tutorials/walkthrough-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HelpButton({ className }: { className?: string }) {
  const { openHelpModal } = useWalkthrough();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-walkthrough="help-btn"
            onClick={() => openHelpModal()}
            className={`h-9 px-2.5 sm:px-3 gap-1.5 text-muted-foreground hover:text-foreground shrink-0 ${className ?? ""}`}
            aria-label="Tutorials and guides"
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline text-xs font-semibold">Guides</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Tutorials & Interactive Guides</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
