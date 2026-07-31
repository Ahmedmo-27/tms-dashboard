import { tms } from "@/lib/tms-api";
import type { Payment } from "@/components/ui/payments/columns";
import {
  isRateLimitError,
  sleep,
  withRetry,
} from "@/lib/utils/retry-request";
import {
  mergePaymentRecords,
  normalizePaymentsPayload,
  parsePayments,
  type RawPaymentRecord,
} from "../utils/parsers/payments-parser";

const REFUND_LIST_ENDPOINTS = [
  "/api/admin/refunds/list",
  "/admin/refunds/list",
] as const;

const CASHOUT_LIST_ENDPOINTS = [
  "/api/admin/refunds/cashout",
  "/api/admin/refunds/cashouts",
  "/admin/refunds/cashout",
  "/admin/refunds/cashouts",
] as const;

/** Delay between each day fetch during export to avoid API rate limits. */
const EXPORT_DAY_DELAY_MS = 500;

export type BranchFilter = {
  id: string;
  branchName: string;
};

async function fetchFromEndpoints(
  endpoints: readonly string[],
  date?: string,
  locationId?: string
): Promise<RawPaymentRecord[]> {
  const searchParams = new URLSearchParams();
  if (date) searchParams.set("date", date);
  if (locationId) searchParams.set("locationId", locationId);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

  for (const endpoint of endpoints) {
    try {
      const response = await tms.get(`${endpoint}${query}`);
      return normalizePaymentsPayload(response.data.data);
    } catch (error) {
      if (isRateLimitError(error)) {
        throw error;
      }
      // Try the next endpoint shape.
    }
  }

  return [];
}

function tagMemberRefundRecords(records: RawPaymentRecord[]): RawPaymentRecord[] {
  return records.map((record) => ({
    ...record,
    isRefunded: true,
    isCashOut: false,
  }));
}

function tagCashOutRecords(records: RawPaymentRecord[]): RawPaymentRecord[] {
  return records.map((record) => ({
    ...record,
    isCashOut: true,
    isRefunded: true,
  }));
}

function filterPaymentsByBranches(
  payments: Payment[],
  branches: BranchFilter[]
): Payment[] {
  const branchNames = new Set(
    branches.map((branch) => branch.branchName.trim().toLowerCase())
  );

  return payments.filter((payment) =>
    branchNames.has(payment.location.trim().toLowerCase())
  );
}

export const getPaymentsForDateRange = async (
  startDate: string,
  endDate: string,
  branches: BranchFilter[],
  onProgress?: (completed: number, total: number) => void
) => {
  if (branches.length === 0) {
    return [];
  }

  const { eachDayOfInterval, format, parseISO } = await import("date-fns");

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const allPayments: Payment[] = [];

  for (let i = 0; i < days.length; i++) {
    const dateStr = format(days[i], "yyyy-MM-dd");

    const dayPayments = await withRetry(() => getPayments(dateStr));
    allPayments.push(...filterPaymentsByBranches(dayPayments, branches));

    onProgress?.(i + 1, days.length);

    if (i < days.length - 1) {
      await sleep(EXPORT_DAY_DELAY_MS);
    }
  }

  return allPayments;
};

export const getPayments = async (date?: string, locationId?: string) => {
  try {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (locationId) params.locationId = locationId;
    const dateQuery =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : "";

    const response = await tms.get(`/admin/payments${dateQuery}`);
    const paymentRecords = normalizePaymentsPayload(response.data.data);

    const refundRecords = await fetchFromEndpoints(
      REFUND_LIST_ENDPOINTS,
      date,
      locationId
    );
    const cashOutRecords = await fetchFromEndpoints(
      CASHOUT_LIST_ENDPOINTS,
      date,
      locationId
    );

    const mergedRecords = mergePaymentRecords(
      paymentRecords,
      mergePaymentRecords(
        tagMemberRefundRecords(refundRecords),
        tagCashOutRecords(cashOutRecords)
      )
    );

    return parsePayments(mergedRecords);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
