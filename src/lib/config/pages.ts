import {
  ScanBarcode,
  QrCode,
  Table2,
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
  Snowflake,
  UserCog,
  LayoutDashboard,
  PieChart,
  Timer,
  ClipboardList,
  Dumbbell,
  Hourglass,
  Building2,
  Repeat,
  BookOpenCheck,
  Bell,
  HandCoins,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PermissionRole } from "@/lib/config/roles";

export type NavItem = {
  title: string;
  url: string;
  icon?: ComponentType<{ className?: string }>;
  roles: readonly PermissionRole[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const FINANCE_ROLES: readonly PermissionRole[] = ["accountant"];

export const pagesMetadata: { navMain: NavGroup[] } = {
  navMain: [
    {
      title: "Finance",
      items: [
        { title: "Overview", url: "/dashboard/finance", icon: LayoutDashboard, roles: FINANCE_ROLES },
        { title: "Sales", url: "/dashboard/finance/sales", icon: PieChart, roles: FINANCE_ROLES },
        { title: "Coach Hours", url: "/dashboard/finance/coach-hours", icon: Timer, roles: FINANCE_ROLES },
        { title: "Coach Package Tracking", url: "/dashboard/finance/coach-packages", icon: ClipboardList, roles: FINANCE_ROLES },
        { title: "PT Analytics", url: "/dashboard/finance/pt", icon: Dumbbell, roles: FINANCE_ROLES },
        { title: "Deferred Revenue", url: "/dashboard/finance/deferred-revenue", icon: Hourglass, roles: FINANCE_ROLES },
        { title: "Branches", url: "/dashboard/finance/branches", icon: Building2, roles: FINANCE_ROLES },
        { title: "Retention", url: "/dashboard/finance/retention", icon: Repeat, roles: FINANCE_ROLES },
        { title: "Ledger & Refunds", url: "/dashboard/finance/ledger", icon: BookOpenCheck, roles: FINANCE_ROLES },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          title: "Package Attribution",
          url: "/dashboard/sales",
          icon: HandCoins,
          roles: ["management", "branch_admin", "sales_manager", "accountant"],
        },
      ],
    },
    {
      title: "Front Desk",
      items: [
        {
          title: "Scans Monitor",
          url: "/dashboard/scans-monitor",
          icon: ScanBarcode,
          roles: ["management", "branch_admin", "accountant"],
        },
        {
          title: "QR Codes",
          url: "/dashboard/qr-codes",
          icon: QrCode,
          roles: ["management", "branch_admin"],
        },
        {
          title: "Sheet",
          url: "/dashboard/sheet",
          icon: Table2,
          roles: ["management", "accountant"],
        },
      ],
    },
    {
      title: "Members",
      items: [
        {
          title: "Our Members",
          url: "/dashboard/our-members",
          icon: Users,
          roles: ["management", "branch_admin", "accountant"],
        },
        {
          title: "Member Requests",
          url: "/dashboard/member-requests?searchString=&page=1",
          icon: UserPlus,
          roles: ["management", "branch_admin"],
        },
        {
          title: "Package Freezes",
          url: "/dashboard/package-freezes",
          icon: Snowflake,
          roles: ["management", "branch_admin"],
        },
      ],
    },
    {
      title: "Operations",
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
          roles: ["management", "branch_admin", "accountant"],
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
      title: "Retail",
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
      title: "Mail",
      items: [
        {
          title: "Compose",
          url: "/dashboard/mailing",
          icon: Mail,
          roles: ["management", "mailer"],
        },
        {
          title: "Inbox",
          url: "/dashboard/mailing/received",
          icon: Mail,
          roles: ["management", "mailer", "accountant"],
        },
        {
          title: "Sent",
          url: "/dashboard/mailing/sent",
          icon: Mail,
          roles: ["management", "mailer", "accountant"],
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Accounts",
          url: "/dashboard/accounts",
          icon: UserCog,
          roles: ["management", "branch_admin"],
        },
        {
          title: "Notifications",
          url: "/dashboard/notifications",
          icon: Bell,
          roles: ["management"],
        },
      ],
    },
  ],
};

export const STAFF_HOME = "/dashboard/scans-monitor";

function navItemPath(url: string): string {
  return url.split("?")[0];
}

export const getPageTitle = (path: string): string => {
  const pathname = navItemPath(path);

  if (pathname === "/dashboard/notifications" || pathname.startsWith("/dashboard/notifications/")) {
    return "Notifications Management";
  }

  if (pathname === "/dashboard/accounts" || pathname.startsWith("/dashboard/accounts/")) {
    return "Accounts Management";
  }

  if (pathname.startsWith("/dashboard/our-members/")) {
    return "Member";
  }

  const catalogTabTitles: Record<string, string> = {
    classes: "Classes",
    packages: "Packages",
    coaches: "Coaches",
  };
  if (pathname === "/dashboard/catalog") {
    const tab = new URLSearchParams(path.split("?")[1] ?? "").get("tab");
    if (tab && catalogTabTitles[tab]) return catalogTabTitles[tab];
  }

  const matches: { title: string; itemPath: string }[] = [];
  for (const group of pagesMetadata.navMain) {
    for (const item of group.items) {
      const itemPath = navItemPath(item.url);
      if (pathname === itemPath || pathname.startsWith(`${itemPath}/`)) {
        matches.push({ title: item.title, itemPath });
      }
    }
  }

  matches.sort((a, b) => b.itemPath.length - a.itemPath.length);
  return matches[0]?.title ?? "Dashboard";
};
