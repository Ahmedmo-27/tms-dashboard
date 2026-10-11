"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import type { FinanceParams } from "@/lib/data/finance";
import { CAIRO_TZ } from "./format";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function defaultFinanceRange() {
  const today = formatInTimeZone(new Date(), CAIRO_TZ, "yyyy-MM-dd");
  return { startDate: `${today.slice(0, 8)}01`, endDate: today };
}

/** Date range + branch from the URL, so views are shareable and survive reloads. */
export function useFinanceFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaults = useMemo(defaultFinanceRange, []);
  const rawStart = searchParams.get("startDate") ?? "";
  const rawEnd = searchParams.get("endDate") ?? "";
  const startDate = DATE_KEY.test(rawStart) ? rawStart : defaults.startDate;
  const endDate = DATE_KEY.test(rawEnd) ? rawEnd : defaults.endDate;
  const locationId = searchParams.get("locationId") ?? undefined;

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { startDate, endDate, locationId, searchParams, setParams };
}

/** Builds a link to another finance page that keeps the current range and branch. */
export function useFinanceHref() {
  const { startDate, endDate, locationId } = useFinanceFilters();
  return useCallback(
    (path: string, extra: Record<string, string | undefined> = {}) => {
      const params = new URLSearchParams();
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      if (locationId) params.set("locationId", locationId);
      for (const [key, value] of Object.entries(extra)) {
        if (value) params.set(key, value);
      }
      return `${path}?${params.toString()}`;
    },
    [startDate, endDate, locationId],
  );
}

export function useFinanceData<T>(
  fetcher: (params: FinanceParams) => Promise<T>,
  extra: FinanceParams = {},
  options: { enabled?: boolean } = {},
) {
  const { startDate, endDate, locationId } = useFinanceFilters();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const extraKey = JSON.stringify(extra);
  const enabled = options.enabled ?? true;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current({
        startDate,
        endDate,
        locationId,
        ...(JSON.parse(extraKey) as FinanceParams),
      });
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id !== requestId.current) return;
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not load this data";
      setError(message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [startDate, endDate, locationId, extraKey, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, startDate, endDate, locationId };
}
