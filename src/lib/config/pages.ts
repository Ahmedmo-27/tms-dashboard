import {
  ScanBarcode,
  QrCode,
  Users,
  UserPlus,
  CalendarDays,
  Package,
  DollarSign,
  Undo2,
  ShoppingCart,
  Receipt,
  Barcode,
  Ticket,
  Mail,
} from "lucide-react";
import type { PermissionRole } from "@/lib/config/roles";

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles: readonly PermissionRole[];
};

export type NavGroup = {
  title: string;
  url: string;
  items: NavItem[];
};

export const pagesMetadata: { navMain: NavGroup[] } = {
  navMain: [
    {
      title: "FrontDesk Action Panel",
      url: "/dashboard/scans-monitor",
      items: [
        {
          title: "Scans Monitor",
          url: "/dashboard/scans-monitor",
          icon: ScanBarcode,
          roles: ["management", "branch_admin"],
        },
        {
          title: "QR Codes",
          url: "/dashboard/qr-codes",
          icon: QrCode,
          roles: ["management", "branch_admin"],
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
          roles: ["management", "branch_admin"],
        },
        {
          title: "Member Requests",
          url: "/dashboard/member-requests",
          icon: UserPlus,
          roles: ["management", "branch_admin"],
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
          roles: ["management", "branch_admin"],
        },
        {
          title: "Catalog",
          url: "/dashboard/catalog",
          icon: Package,
          roles: ["management", "branch_admin"],
        },
        {
          title: "Payments",
          url: "/dashboard/payments",
          icon: DollarSign,
          roles: ["management", "branch_admin"],
        },
        {
          title: "Refunds",
          url: "/dashboard/refunds",
          icon: Undo2,
          roles: ["management", "branch_admin"],
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
          roles: ["management", "branch_admin"],
        },
        {
          title: "Orders",
          url: "/dashboard/orders",
          icon: Receipt,
          roles: ["management", "branch_admin"],
        },
        {
          title: "Products",
          url: "/dashboard/products",
          icon: Barcode,
          roles: ["management", "branch_admin"],
        },
      ],
    },
    {
      title: "Support",
      url: "/dashboard/tickets",
      items: [
        {
          title: "Tickets",
          url: "/dashboard/tickets",
          icon: Ticket,
          roles: ["management", "branch_admin"],
        },
      ],
    },
    {
      title: "Communications",
      url: "/dashboard/mailing",
      items: [
        {
          title: "Compose",
          url: "/dashboard/mailing",
          icon: Mail,
          roles: ["management"],
        },
        {
          title: "Inbox",
          url: "/dashboard/mailing/received",
          icon: Mail,
          roles: ["management"],
        },
        {
          title: "Sent",
          url: "/dashboard/mailing/sent",
          icon: Mail,
          roles: ["management"],
        },
      ],
    },
  ],
};

export const getPageTitle = (path: string): string => {
  const pathData = pagesMetadata.navMain.find((p) =>
    p.items.find((i) => i.url === path)
  );
  const subPathData = pathData?.items.find((i) => i.url === path);
  return subPathData?.title || pathData?.title || "Dashboard";
};
