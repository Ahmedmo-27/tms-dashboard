export const dynamic = "force-dynamic";
import InventoryContainer from "@/components/ui/products/inventory-container";
import { getProducts } from "@/lib/data/products";
import { Product } from "@/components/ui/checkout/products-container";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
export default async function Page() {
  try {
    const products: Product[] = await getProducts();
    return (
      <div className="flex min-h-full flex-col gap-8 p-8">
        <InventoryContainer products={products} />
      </div>
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Payments Data Unavailable"
          description="Unable to load payments information due to network issues."
          showBackButton={false}
        />
      );
    } else if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
  }
}
