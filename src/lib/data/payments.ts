import { tms } from "@/lib/tms-api";
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
    } catch {
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

export const getPaymentsForDateRange = async (
  startDate: string,
  endDate: string,
  locationId?: string,
  onProgress?: (completed: number, total: number) => void
) => {
  const { eachDayOfInterval, format, parseISO } = await import("date-fns");

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const allPayments: Awaited<ReturnType<typeof getPayments>> = [];
  const batchSize = 5;

  for (let i = 0; i < days.length; i += batchSize) {
    const batch = days.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((day) => getPayments(format(day, "yyyy-MM-dd"), locationId))
    );
    allPayments.push(...results.flat());
    onProgress?.(Math.min(i + batch.length, days.length), days.length);
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

    const [refundRecords, cashOutRecords] = await Promise.all([
      fetchFromEndpoints(REFUND_LIST_ENDPOINTS, date, locationId),
      fetchFromEndpoints(CASHOUT_LIST_ENDPOINTS, date, locationId),
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
