"use server"
import { tms } from "@/lib/tms-api";
import { Cart } from "@/components/ui/checkout/products-container";
import { revalidatePath } from "next/cache";
import { parseOrders } from "../utils/parsers/orders-parser";

interface CartInfo {
  barcode: string;
  quantity: number;
}

export const getOrders = async (locationId?: string, date?: string) => {
  try {
    const params: Record<string, string> = {};
    if (locationId) params.locationId = locationId;
    if (date) params.date = date;
    const response = await tms.get("/admin/orders", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    const orders = parseOrders(response.data.data);
    return orders;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const submitOrder = async (cart: Cart, locationId?: string) => {
  try {
    const cartInfo: CartInfo[] = [];
    cart.items.forEach((item) => {
      cartInfo.push({
        barcode: item.barcode,
        quantity: item.quantity,
      });
    });
    await tms.post("/admin/orders", {
      items: cartInfo,
      ...(locationId ? { locationId } : {}),
    });
    revalidatePath("/dashboard/checkout");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
