"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Input } from "../input";
import { Button } from "../button";
import { Search, DollarSign} from "lucide-react";
import { useState, useMemo } from "react";
import { Product } from "../checkout/products-container";

export default function InventoryContainer({
  products,
}: {
  products: Product[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  // Filter payments based on search
  const filterdProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.item.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [products, searchTerm]);
  return (
    <div className="space-y-6">
      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Inventory</CardTitle>
              <p className="text-sm text-muted-foreground">
                {products.length} products
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 w-full md:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <DataTable columns={columns} data={filterdProducts} />
            {products.length === 0 && products.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Orders will appear here once they are recorded
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
