import { ColumnDef } from "@tanstack/react-table";
import { Product } from "../checkout/products-container";


export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "barcode",
    header: "Barcode",
  },
  {
    accessorKey: "item",
    header: "Item",
  },
  {
    accessorKey: "brand",
    header: "Brand",
  },
  {
    accessorKey: "quantity",
    header: "Stock",
  },{
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="font-semibold text-primary">
        ${row.original.price.toFixed(2)}
      </span>
    ),
  }
];
