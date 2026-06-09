import {
  ScanBarcode,
  QrCode,
  Users,
  UserPlus,
  CalendarDays,
  Package,
  Dumbbell,
  DollarSign,
  Undo2,
  ShoppingCart,
  Receipt,
  Barcode
} from "lucide-react";
export const pagesMetadata = {
  navMain: [
    {
      title: "FrontDesk Action Panel",
      url: "/dashboard/scans-monitor",
      items: [
        {
          title: "Scans Monitor",
          url: "/dashboard/scans-monitor",
          icon: ScanBarcode,
        },
        {
          title: "QR Codes",
          url: "/dashboard/qr-codes",
          icon: QrCode,
        },
      ],
    },
    {
      title: "Members Management",
      url: "/dashboard/our-members",
      items: [
        {
          title: "Our Members",
          url: "/dashboard/our-members",
          icon: Users,
        },
        {
          title: "Member Requests",
          url: "/dashboard/member-requests",
          icon: UserPlus,
        },
      ],
    },
    {
      title: "Spaceship Control Room",
      url: "/dashboard/schedule",
      items: [
        {
          title: "Schedule",
          url: "/dashboard/schedule",
          icon: CalendarDays,
        },
        {
          title: "Catalog",
          url: "/dashboard/catalog",
          icon: Package,
        },
        {
          title: "Payments",
          url: "/dashboard/payments",
          icon: DollarSign,
        },
        {
          title: "Refunds",
          url: "/dashboard/refunds",
          icon: Undo2,
        },
      ],
    },
    {
      title: "Products",
      url: "/dashboard/products",
      items: [
        {
          title: "Checkout",
          url: "/dashboard/checkout",
          icon: ShoppingCart,
        },
        {
          title: "Orders",
          url: "/dashboard/orders",
          icon: Receipt,
        },
        {
          title: "Products",
          url: "/dashboard/products",
          icon: Barcode,
        },
      ],
    },
  ],
};

export type PagePath = keyof typeof pagesMetadata;

export const getPageTitle = (path: string): string => {
  const pathData = pagesMetadata.navMain.find((p) =>
    p.items.find((i) => i.url === path)
  );
  const subPathData = pathData?.items.find((i) => i.url === path);
  return subPathData?.title || pathData?.title || "Dashboard";
};
