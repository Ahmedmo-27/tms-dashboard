import { Loader2, Snowflake } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
        <Snowflake className="h-6 w-6 animate-pulse" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading package freezes...</span>
      </div>
    </div>
  );
}
