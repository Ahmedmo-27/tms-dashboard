import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "./format";

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** Percent change vs the previous period. */
  delta?: number | null;
  /** Whether a rise is good (revenue), bad (refunds) or neither. */
  upIs?: "good" | "bad" | "neutral";
  hint?: ReactNode;
  emphasis?: boolean;
  className?: string;
};

export function StatTile({ label, value, delta, upIs = "good", hint, emphasis, className }: StatTileProps) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const direction = !hasDelta || delta === 0 ? "flat" : delta! > 0 ? "up" : "down";
  const tone =
    direction === "flat" || upIs === "neutral"
      ? "neutral"
      : (direction === "up") === (upIs === "good")
        ? "good"
        : "bad";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <Card className={cn("gap-1 px-4 py-4 shadow-none", emphasis && "bg-muted/40", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-semibold tracking-tight tabular-nums leading-tight",
          emphasis ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
        )}
      >
        {value}
      </p>
      <div className="flex min-h-[18px] flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {hasDelta && (
          <span
            className="inline-flex items-center gap-0.5 font-medium"
            style={{
              color:
                tone === "good" ? "var(--viz-good)" : tone === "bad" ? "var(--viz-bad)" : undefined,
            }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {delta! > 0 ? "+" : ""}
            {formatPercent(delta)}
            <span className="sr-only">
              {tone === "good" ? " (improved)" : tone === "bad" ? " (worse)" : ""}
            </span>
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>
  );
}
