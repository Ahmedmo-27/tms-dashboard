import { Product } from "@/components/ui/checkout/products-container";
import { Order, OrderItem } from "@/components/ui/orders/columns"
import { getProducts } from "@/lib/data/products"
import { getBranchLabel } from "@/lib/utils/location-label";

export const parseOrders = async (orders: any) => {
    const products: Product[] = await getProducts();
    const parsedOrders: Order[] = []
    orders.forEach((order: any) => {
        const parsedOrder: Order = {
          items: [],
          total: 0,
          date: order.createdAt,
          branchLabel: getBranchLabel(order.locationId) ?? undefined,
        }
        order.cart.forEach((item: any) => {
            const product = products.find((product: any) => product.barcode === item.barcode);
            if(!product) return
            let parsedOrderItem: OrderItem = {
                barcode: item.barcode,
                item: product.item,
                brand: product.brand,
                quantity: item.quantity,
                price: product.price
            }
            parsedOrder.items.push(parsedOrderItem)
            parsedOrder.total += product.price;
        })
        parsedOrders.push(parsedOrder)
    })
    parsedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return parsedOrders;
}