"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useWalkthrough } from "@/lib/tutorials/walkthrough-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Sparkles, Check } from "lucide-react";

export function WalkthroughOverlay() {
  const {
    isActive,
    activeScenario,
    currentStep,
    stepIndex,
    totalSteps,
    isLastStep,
    targetRect,
    isNavigating,
    nextStep,
    prevStep,
    skipTutorial,
  } = useWalkthrough();

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const paddedHole = useMemo(() => {
    if (!targetRect) return null;
    const pad = 8;
    const left = Math.max(0, targetRect.left - pad);
    const top = Math.max(0, targetRect.top - pad);
    const width = Math.max(20, targetRect.width + pad * 2);
    const height = Math.max(20, targetRect.height + pad * 2);

    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  }, [targetRect]);

  // Card Positioning logic
  const cardStyle = useMemo<React.CSSProperties>(() => {
    const cardWidth = Math.min(420, windowSize.width - 32);
    const estimatedCardHeight = 220;

    if (!paddedHole) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: cardWidth,
        zIndex: 9999,
      };
    }

    let top = paddedHole.bottom + 16;
    let left = paddedHole.left;

    // Adjust left if overflowing right edge
    if (left + cardWidth > windowSize.width - 16) {
      left = windowSize.width - cardWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    // If card overflows bottom, flip to above the spotlight hole
    if (top + estimatedCardHeight > windowSize.height - 16) {
      if (paddedHole.top - estimatedCardHeight - 16 > 16) {
        top = paddedHole.top - estimatedCardHeight - 16;
      } else {
        top = Math.max(16, windowSize.height - estimatedCardHeight - 24);
      }
    }

    return {
      position: "fixed",
      top: Math.max(16, Math.min(top, windowSize.height - estimatedCardHeight - 16)),
      left: Math.max(16, left),
      width: cardWidth,
      zIndex: 9999,
    };
  }, [paddedHole, windowSize]);

  if (!isActive || !currentStep || !activeScenario) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-none">
      {/* SVG Spotlight Mask */}
      <svg className="absolute inset-0 h-full w-full pointer-events-auto">
        <defs>
          <mask id="walkthrough-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {paddedHole && (
              <rect
                x={paddedHole.left}
                y={paddedHole.top}
                width={paddedHole.width}
                height={paddedHole.height}
                rx={12}
                ry={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#walkthrough-spotlight-mask)"
        />
        {paddedHole && (
          <rect
            x={paddedHole.left}
            y={paddedHole.top}
            width={paddedHole.width}
            height={paddedHole.height}
            rx={12}
            ry={12}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Floating Tooltip Card */}
      <div
        style={cardStyle}
        className="pointer-events-auto rounded-2xl border border-primary/40 bg-zinc-950/95 p-5 text-white shadow-2xl backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant="outline"
              className="border-primary/50 text-primary bg-primary/10 text-xs px-2 py-0.5 font-mono shrink-0"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {activeScenario.title}
            </Badge>
            <span className="text-xs text-zinc-400 font-mono">
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>
          <button
            type="button"
            onClick={skipTutorial}
            className="text-zinc-400 hover:text-white rounded-lg p-1 transition-colors hover:bg-zinc-800"
            aria-label="Exit tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Instruction */}
        <div className="space-y-1.5 mb-4">
          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            {currentStep.title}
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {isNavigating ? "Navigating to target page..." : currentStep.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            {stepIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="text-zinc-400 hover:text-white h-8 px-2.5"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTutorial}
              className="text-zinc-400 hover:text-zinc-200 h-8 px-2.5 text-xs"
            >
              Skip
            </Button>
          </div>

          <Button
            size="sm"
            onClick={nextStep}
            className="h-8 px-4 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
