export const dynamic = "force-dynamic";
import ProductsContainer, {
  Product,
} from "@/components/ui/checkout/products-container";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import { getProducts } from "@/lib/data/products";

export default async function Page() {
  try {
    const products: Product[] = await getProducts();
    return (
      <div className="flex min-h-full flex-col gap-8 p-8">
        <ProductsContainer products={products} />
      </div>
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Products Data Unavailable"
          description="Unable to load products information due to network issues."
          showBackButton={false}
        />
      );
    }else if(error instanceof UnauthorizedError){
      return (
        <UnauthorizedPage />
      )
    }
  }
}
