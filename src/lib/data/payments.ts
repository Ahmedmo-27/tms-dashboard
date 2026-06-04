import { tms } from "@/lib/tms-api";
import { parsePayments } from "../utils/parsers/payments-parser";

export const getPayments = async (date?: string) => {
    try {
        const url = date ? `/admin/payments?date=${date}` : "/admin/payments";
        const response = await tms.get(url);
        const payments = parsePayments(response.data.data);
        return payments;
    } catch (error) {
        console.error(error);
        throw error;
    }
}