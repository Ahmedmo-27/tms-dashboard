"use server"
import { tms } from "@/lib/tms-api";
import { Cart } from "@/components/ui/checkout/products-container";
import { revalidatePath } from "next/cache";
import { parseOrders } from "../utils/parsers/orders-parser";

interface CartInfo {
  barcode: string;
  quantity: number;
}

export const getOrders = async (locationId?: string) => {
  try {
    const params = locationId ? { locationId } : undefined;
    const response = await tms.get("/admin/orders", { params });
    const orders = parseOrders(response.data.data);
    return orders;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const submitOrder = async (cart: Cart) => {
  try {
    const cartInfo: CartInfo[] = [];
    cart.items.forEach((item) => {
      cartInfo.push({
        barcode: item.barcode,
        quantity: item.quantity,
      });
    });
    await tms.post("/admin/orders", cartInfo);
    revalidatePath("/dashboard/checkout");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
