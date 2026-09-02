"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  findTutorialScenario,
  TutorialScenario,
} from "./tutorial-data";
import {
  walkthroughScenarios,
  WalkthroughStep,
} from "./walkthrough-steps";

interface WalkthroughContextValue {
  isActive: boolean;
  activeScenario: TutorialScenario | null;
  currentStep: WalkthroughStep | null;
  stepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  targetRect: DOMRect | null;
  targetElement: HTMLElement | null;
  isNavigating: boolean;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  startTutorial: (scenarioId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  openHelpModal: (scenarioId?: string) => void;
  closeHelpModal: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

function cleanPath(url: string): string {
  return url.split("?")[0];
}

export function WalkthroughProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const targetElementRef = useRef<HTMLElement | null>(null);

  const activeScenario = useMemo(
    () => (activeScenarioId ? findTutorialScenario(activeScenarioId) ?? null : null),
    [activeScenarioId]
  );

  const steps = useMemo<WalkthroughStep[]>(
    () => (activeScenarioId ? walkthroughScenarios[activeScenarioId] ?? [] : []),
    [activeScenarioId]
  );

  const currentStep = useMemo<WalkthroughStep | null>(() => {
    if (!activeScenarioId || stepIndex < 0 || stepIndex >= steps.length) {
      return null;
    }
    return steps[stepIndex] ?? null;
  }, [activeScenarioId, stepIndex, steps]);

  const isActive = Boolean(activeScenario && currentStep);
  const totalSteps = steps.length;
  const isLastStep = stepIndex >= totalSteps - 1;

  // Safe rect updater that only triggers re-render if position/size changed
  const updateRect = useCallback(() => {
    const el = targetElementRef.current;
    if (!el || !el.isConnected) return;
    const r = el.getBoundingClientRect();

    setTargetRect((prev) => {
      if (
        prev &&
        Math.round(prev.left) === Math.round(r.left) &&
        Math.round(prev.top) === Math.round(r.top) &&
        Math.round(prev.width) === Math.round(r.width) &&
        Math.round(prev.height) === Math.round(r.height)
      ) {
        return prev; // Same rect -> avoid re-render
      }
      return r;
    });
  }, []);

  // Main lifecycle for finding element and managing routing
  useEffect(() => {
    if (!isActive || !currentStep) {
      targetElementRef.current = null;
      setTargetRect(null);
      setIsNavigating(false);
      return;
    }

    const currentClean = cleanPath(pathname);
    const stepClean = cleanPath(currentStep.route);

    if (currentClean !== stepClean) {
      setIsNavigating(true);
      targetElementRef.current = null;
      setTargetRect(null);
      router.push(currentStep.route);
      return;
    }

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const findTarget = () => {
      if (!isMounted) return;

      const el =
        (document.querySelector(currentStep.targetSelector) as HTMLElement | null) ??
        (currentStep.fallbackSelector
          ? (document.querySelector(currentStep.fallbackSelector) as HTMLElement | null)
          : null);

      if (el) {
        targetElementRef.current = el;
        const r = el.getBoundingClientRect();
        setTargetRect(r);
        setIsNavigating(false);
        try {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch {
          // ignore scroll errors
        }
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        setIsNavigating(true);
        timerId = setTimeout(findTarget, 100);
      } else {
        // Fallback: Show guide card centered if element is not present
        targetElementRef.current = null;
        setTargetRect(null);
        setIsNavigating(false);
      }
    };

    findTarget();

    // Throttled scroll & resize listener
    let rAfId: number | null = null;
    const handleScrollResize = () => {
      if (rAfId !== null) return;
      rAfId = requestAnimationFrame(() => {
        rAfId = null;
        updateRect();
      });
    };

    window.addEventListener("resize", handleScrollResize, { passive: true });
    window.addEventListener("scroll", handleScrollResize, { passive: true, capture: true });

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (rAfId !== null) cancelAnimationFrame(rAfId);
      window.removeEventListener("resize", handleScrollResize);
      window.removeEventListener("scroll", handleScrollResize, { capture: true });
    };
  }, [isActive, currentStep, pathname, router, updateRect]);

  const startTutorial = useCallback(
    (scenarioId: string) => {
      const scenario = findTutorialScenario(scenarioId);
      const scenarioSteps = walkthroughScenarios[scenarioId];
      if (!scenario || !scenarioSteps || scenarioSteps.length === 0) return;

      setIsHelpModalOpen(false);
      setActiveScenarioId(scenarioId);
      setStepIndex(0);

      const firstStep = scenarioSteps[0];
      const currentClean = cleanPath(pathname);
      const firstClean = cleanPath(firstStep.route);

      if (currentClean !== firstClean) {
        setIsNavigating(true);
        router.push(firstStep.route);
      }
    },
    [pathname, router]
  );

  const nextStep = useCallback(() => {
    if (!isActive) return;

    if (isLastStep) {
      setActiveScenarioId(null);
      setStepIndex(0);
      targetElementRef.current = null;
      setTargetRect(null);
      setIsNavigating(false);
      return;
    }

    const nextIdx = stepIndex + 1;
    const nextStepItem = steps[nextIdx];
    setStepIndex(nextIdx);

    if (nextStepItem) {
      const currentClean = cleanPath(pathname);
      const nextClean = cleanPath(nextStepItem.route);
      if (currentClean !== nextClean) {
        setIsNavigating(true);
        router.push(nextStepItem.route);
      }
    }
  }, [isActive, isLastStep, stepIndex, steps, pathname, router]);

  const prevStep = useCallback(() => {
    if (!isActive || stepIndex <= 0) return;

    const prevIdx = stepIndex - 1;
    const prevStepItem = steps[prevIdx];
    setStepIndex(prevIdx);

    if (prevStepItem) {
      const currentClean = cleanPath(pathname);
      const prevClean = cleanPath(prevStepItem.route);
      if (currentClean !== prevClean) {
        setIsNavigating(true);
        router.push(prevStepItem.route);
      }
    }
  }, [isActive, stepIndex, steps, pathname, router]);

  const skipTutorial = useCallback(() => {
    setActiveScenarioId(null);
    setStepIndex(0);
    targetElementRef.current = null;
    setTargetRect(null);
    setIsNavigating(false);
  }, []);

  const openHelpModal = useCallback(
    (scenarioId?: string) => {
      if (scenarioId) {
        startTutorial(scenarioId);
      } else {
        setIsHelpModalOpen(true);
      }
    },
    [startTutorial]
  );

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false);
  }, []);

  // Global Esc key to exit tutorial
  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTutorial();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, skipTutorial]);

  const targetElement = targetElementRef.current;

  const value = useMemo<WalkthroughContextValue>(
    () => ({
      isActive,
      activeScenario,
      currentStep,
      stepIndex,
      totalSteps,
      isLastStep,
      targetRect,
      targetElement,
      isNavigating,
      isHelpModalOpen,
      setIsHelpModalOpen,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      openHelpModal,
      closeHelpModal,
    }),
    [
      isActive,
      activeScenario,
      currentStep,
      stepIndex,
      totalSteps,
      isLastStep,
      targetRect,
      targetElement,
      isNavigating,
      isHelpModalOpen,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      openHelpModal,
      closeHelpModal,
    ]
  );

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error("useWalkthrough must be used within a WalkthroughProvider");
  }
  return context;
}
