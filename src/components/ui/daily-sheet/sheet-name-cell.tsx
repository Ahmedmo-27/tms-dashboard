"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { tms } from "@/lib/tms-api";
import { cn } from "@/lib/utils";

type MemberHit = {
  _id: string;
  name: string;
  phoneNumber?: string;
};

export function SheetNameCell({
  value,
  memberId,
  disabled,
  onChange,
}: {
  value: string;
  memberId?: string;
  disabled?: boolean;
  onChange: (next: { name: string; memberId?: string; phone?: string }) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<MemberHit[]>([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Picking a hit rewrites the query, which would otherwise re-trigger a search
  // for a name that is already resolved.
  const pickedNameRef = useRef<string | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (disabled || query.trim().length < 2 || query === pickedNameRef.current) {
      setHits([]);
      setSearching(false);
      return;
    }
    // Flagged before the debounce elapses so a keystroke shows progress
    // immediately rather than 250ms later.
    setSearching(true);
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const response = await tms.get("/admin/members/search", {
          params: { name: query.trim() },
        });
        if (!cancelled) setHits((response.data.data as MemberHit[]) ?? []);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, disabled]);

  const noMatches =
    !searching &&
    hits.length === 0 &&
    !memberId &&
    query.trim().length >= 2 &&
    query !== pickedNameRef.current;

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <input
        value={query}
        disabled={disabled}
        onChange={(e) => {
          const name = e.target.value;
          pickedNameRef.current = null;
          setQuery(name);
          setOpen(true);
          onChange({ name, memberId: undefined });
        }}
        onFocus={() => setOpen(true)}
        className={cn(
          "h-8 w-full bg-transparent px-2 text-xs outline-none",
          "focus:bg-primary/5",
          (searching || memberId) && !disabled && "pr-6",
          disabled && "cursor-default text-foreground"
        )}
      />
      {open && !disabled && (searching || hits.length > 0 || noMatches) && (
        <ul className="absolute z-40 mt-0.5 max-h-48 w-72 overflow-auto rounded-md border bg-popover p-1 text-xs shadow-md">
          {searching && hits.length === 0 ? (
            <li className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching members…
            </li>
          ) : null}
          {noMatches ? (
            <li className="px-2 py-1.5 text-muted-foreground">
              No member found — this row will be treated as a guest.
            </li>
          ) : null}
          {hits.map((hit) => (
            <li key={hit._id}>
              <button
                type="button"
                className="flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  pickedNameRef.current = hit.name;
                  setQuery(hit.name);
                  setOpen(false);
                  setHits([]);
                  onChange({
                    name: hit.name,
                    memberId: hit._id,
                    phone: hit.phoneNumber,
                  });
                }}
              >
                <span className="font-medium">{hit.name}</span>
                {hit.phoneNumber ? (
                  <span className="text-muted-foreground">{hit.phoneNumber}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!disabled && searching ? (
        <Loader2
          aria-label="Searching members"
          className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : memberId && !disabled ? (
        <span className="pointer-events-none absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-500" />
      ) : null}
    </div>
  );
}
