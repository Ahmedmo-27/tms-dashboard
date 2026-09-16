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
  "/admin/refunds/list",
] as const;

const CASHOUT_LIST_ENDPOINTS = [
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
  locationId?: string,
  startDate?: string,
  endDate?: string
): Promise<RawPaymentRecord[]> {
  const searchParams = new URLSearchParams();
  if (date) searchParams.set("date", date);
  if (startDate) searchParams.set("startDate", startDate);
  if (endDate) searchParams.set("endDate", endDate);
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

  try {
    onProgress?.(1, 2);
    const rangePayments = await withRetry(() =>
      getPayments(undefined, undefined, startDate, endDate)
    );
    onProgress?.(2, 2);
    return filterPaymentsByBranches(rangePayments, branches);
  } catch (error) {
    // Fallback to day-by-day fetch if single-range query fails
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
  }
};

export const getPayments = async (
  date?: string,
  locationId?: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (locationId) params.locationId = locationId;
    const dateQuery =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : "";

    // For historical date ranges, allow up to 60s to prevent premature ECONNABORTED
    const isLargeRange = Boolean(startDate && endDate && startDate !== endDate);
    const timeout = isLargeRange ? 60000 : 30000;

    const response = await tms.get(`/admin/payments${dateQuery}`, { timeout });
    const paymentRecords = normalizePaymentsPayload(response.data?.data);

    // If the response is from TMS API's unified PaymentsService (which already combines
    // payments, member refunds, and cashouts) or already includes money-out/refund entries,
    // return directly without firing redundant secondary endpoint requests.
    const isUnifiedApi =
      response.data?.message === "Fetched Payments!" ||
      paymentRecords.some(
        (r) => r.entryType === "REFUND" || r.entryType === "CASHOUT" || r.isMoneyOut === true
      );

    if (isUnifiedApi || paymentRecords.length > 0) {
      return parsePayments(paymentRecords);
    }

    // Legacy fallback only for older API backends where refunds were kept separate:
    const [refundRecords, cashOutRecords] = await Promise.all([
      fetchFromEndpoints(
        REFUND_LIST_ENDPOINTS,
        date,
        locationId,
        startDate,
        endDate
      ),
      fetchFromEndpoints(
        CASHOUT_LIST_ENDPOINTS,
        date,
        locationId,
        startDate,
        endDate
      ),
    ]);

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
