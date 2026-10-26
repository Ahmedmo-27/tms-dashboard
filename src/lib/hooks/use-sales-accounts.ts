"use client";

import { useCallback, useEffect, useState } from "react";
import { getSalesAccounts } from "@/lib/data/sales";
import type { SalesAccount } from "@/types/sales";

type UseSalesAccountsResult = {
  accounts: SalesAccount[];
  isLoading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
};

/**
 * Sales accounts a sold package can be credited to. Used by the sales
 * dashboard and by the front-desk subscribe dialog.
 */
export function useSalesAccounts(enabled = true): UseSalesAccountsResult {
  const [accounts, setAccounts] = useState<SalesAccount[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setAccounts(await getSalesAccounts());
      setError(false);
    } catch {
      setAccounts([]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    void load();
  }, [enabled, load]);

  return { accounts, isLoading, error, refresh: load };
}
