"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setVisible(true);
    setProgress(15);

    // Increment progress gradually up to 85%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        // As it gets higher, slow down the increment
        const step = Math.max(1, (85 - prev) * 0.15);
        return prev + step;
      });
    }, 150);
  };

  const finishProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  };

  // Complete progress on pathname / query change
  useEffect(() => {
    finishProgress();
  }, [pathname, searchParams]);

  // Intercept click on internal links to start progress immediately
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement | null;
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Skip external links, hash links, mailto/tel, new tabs, and modified clicks
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("blob:") ||
        targetAttr === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.defaultPrevented
      ) {
        return;
      }

      // Check if it's an internal URL
      try {
        const url = new URL(href, window.location.href);
        const isSameOrigin = url.origin === window.location.origin;
        const isDifferentPath =
          url.pathname !== window.location.pathname ||
          url.search !== window.location.search;

        if (isSameOrigin && isDifferentPath) {
          startProgress();
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    const attachLinkListeners = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>("a[href]");
      links.forEach((link) => {
        link.removeEventListener("click", handleAnchorClick);
        link.addEventListener("click", handleAnchorClick);
      });
    };

    // Attach initially and observe DOM changes (e.g. dynamic menus)
    attachLinkListeners();

    const observer = new MutationObserver(() => {
      attachLinkListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[3px] w-full overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out shadow-[0_0_8px_var(--color-primary)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: progress === 100 ? "width 150ms ease-out, opacity 250ms ease-in" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}

export function PageProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
