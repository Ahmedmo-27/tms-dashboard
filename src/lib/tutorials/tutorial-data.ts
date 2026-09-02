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
  Building2,
  HelpCircle,
  CreditCard,
  UserCheck,
  Send,
  Inbox,
  Tags,
  Layers,
  Compass,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PermissionRole } from "@/lib/config/roles";

export type IconComponent = ComponentType<{ className?: string }>;

export interface TutorialStep {
  title: string;
  description: string;
  icon?: IconComponent;
}

export interface TutorialScenario {
  id: string;
  title: string;
  subtitle: string;
  icon: IconComponent;
  roles: readonly PermissionRole[];
  badge?: string;
  keywords?: string[];
  steps: TutorialStep[];
}

export interface TutorialSection {
  title: string;
  roles?: readonly PermissionRole[];
  scenarios: TutorialScenario[];
}

export const tutorialSections: TutorialSection[] = [
  {
    title: "Getting Started & Navigation",
    scenarios: [
      {
        id: "dash-overview",
        title: "Dashboard Overview & Navigation",
        subtitle: "Sidebar navigation, breadcrumbs, command palette, and quick search",
        icon: Compass,
        roles: ["management", "branch_admin"],
        badge: "Core",
        keywords: [
          "sidebar",
          "navigation",
          "command palette",
          "ctrl k",
          "cmd k",
          "help",
          "search",
          "guides",
          "menu",
          "overview",
        ],
        steps: [
          {
            title: "Collapsible Sidebar",
            description:
              "The left sidebar contains all operational modules grouped by Front Desk, Members, Operations, Retail, Support, and Mail.",
            icon: Layers,
          },
          {
            title: "Header & Breadcrumbs",
            description:
              "The top bar shows your current location in the portal and provides instant access to global tools.",
            icon: Compass,
          },
          {
            title: "Command Palette (Ctrl + K)",
            description:
              "Press Ctrl+K (or Cmd+K on macOS) anywhere to quickly search members, jump between pages, or trigger quick actions.",
            icon: HelpCircle,
          },
          {
            title: "Help & Interactive Guides",
            description:
              "Click the Help button anytime to browse interactive tutorials for your role and replay step-by-step walkthroughs.",
            icon: HelpCircle,
          },
        ],
      },
      {
        id: "mgmt-branch-switch",
        title: "Multi-Branch Context Switching",
        subtitle: "Switching active branch context across scans, schedules, and operations",
        icon: Building2,
        roles: ["management"],
        badge: "Management",
        keywords: [
          "branch switch",
          "switch branch",
          "change branch",
          "select location",
          "multi branch",
          "branch selector",
          "cairo",
          "north coast",
          "location select",
        ],
        steps: [
          {
            title: "Branch Selector Bar",
            description:
              "As management, you have organization-wide visibility. The branch selector appears on all branch-scoped pages.",
            icon: Building2,
          },
          {
            title: "Selecting Active Branch",
            description:
              "Click the branch dropdown to switch between Cairo, North Coast, or other gym branches.",
            icon: Building2,
          },
          {
            title: "Context-Aware Operations",
            description:
              "All scans, calendars, POS orders, and financial logs automatically refresh to reflect the chosen branch.",
            icon: Layers,
          },
        ],
      },
    ],
  },
  {
    title: "Front Desk & Live Radar",
    scenarios: [
      {
        id: "scans-monitor-flow",
        title: "Live Attendance Radar",
        subtitle: "Real-time check-in stream, PT & Open Gym sessions, and scan alerts",
        icon: ScanBarcode,
        roles: ["management", "branch_admin"],
        keywords: [
          "scans",
          "live radar",
          "socket",
          "pt attendance",
          "open gym attendance",
          "failed scan",
          "turnstile",
          "check in",
          "attendance",
          "live check-in",
        ],
        steps: [
          {
            title: "Real-Time WebSocket Radar",
            description:
              "The Scans Monitor listens to turnstiles and front-desk QR scans in real time, displaying a live green/red indicator.",
            icon: ScanBarcode,
          },
          {
            title: "Personal Training & Open Gym",
            description:
              "Attendance cards show trainees currently checked in for personal training and open gym workouts.",
            icon: UserCheck,
          },
          {
            title: "Upcoming Classes Grid",
            description:
              "View today's scheduled classes, assigned coaches, enrolled attendees, and remaining spot capacities.",
            icon: CalendarDays,
          },
        ],
      },
      {
        id: "quick-actions-walkin",
        title: "Front Desk Quick Actions",
        subtitle: "Register walk-in drop-ins and subscribe members directly from the radar",
        icon: UserPlus,
        roles: ["management", "branch_admin"],
        keywords: [
          "add package",
          "guest package",
          "subscribe to open gym",
          "open gym drop-in",
          "open gym drop in",
          "drop in",
          "add drop-in",
          "add drop in",
          "walk in",
          "walk-in",
          "day pass",
          "guest pass",
          "quick actions",
          "front desk",
          "subscribe open gym",
        ],
        steps: [
          {
            title: "Quick Actions Menu",
            description:
              "Open the Quick Actions menu at the top right of the Scans Monitor to quickly handle front-desk requests.",
            icon: UserPlus,
          },
          {
            title: "Open Gym Drop-In",
            description:
              "Select 'Open gym drop-in' to record a one-time day pass payment and register attendance instantly.",
            icon: CreditCard,
          },
          {
            title: "Subscribe to Open Gym",
            description:
              "Assign an open gym membership package to an existing member right from the front-desk console.",
            icon: Package,
          },
        ],
      },
      {
        id: "qr-code-generation",
        title: "Generate Branch & Class QR Codes",
        subtitle: "Create high-resolution printable QR codes for turnstiles and studio kiosks",
        icon: QrCode,
        roles: ["management", "branch_admin"],
        keywords: [
          "generate qr",
          "qr code",
          "turnstile qr",
          "class qr",
          "studio entrance",
          "print qr",
          "kiosk",
          "download qr",
        ],
        steps: [
          {
            title: "Open QR Codes Console",
            description:
              "Navigate to QR Codes in the Front Desk menu to create branch entry or class attendance codes.",
            icon: QrCode,
          },
          {
            title: "Select Branch & Type",
            description:
              "Choose whether you are generating a Studio Entrance QR or a specific Class Check-in code.",
            icon: Building2,
          },
          {
            title: "Export & Print",
            description:
              "Download or print the high-resolution QR template for turnstiles, reception desk, or studio doors.",
            icon: QrCode,
          },
        ],
      },
    ],
  },
  {
    title: "Member Management",
    scenarios: [
      {
        id: "member-directory-management",
        title: "Member Directory & Profile Inspection",
        subtitle: "Search members, inspect package credits, and review attendance logs",
        icon: Users,
        roles: ["management", "branch_admin"],
        keywords: [
          "find members",
          "search members",
          "member directory",
          "profile",
          "attendance logs",
          "credits",
          "remaining sessions",
          "inspect member",
          "phone search",
        ],
        steps: [
          {
            title: "Member Search",
            description:
              "Search our member database by full name, mobile phone number, or email address.",
            icon: Users,
          },
          {
            title: "Open Member Profile",
            description:
              "Click on any member row to open their complete profile, active packages, and attendance history.",
            icon: UserCheck,
          },
          {
            title: "Inspect Subscription Credits",
            description:
              "View remaining session balances, package expiration dates, and assigned personal trainers.",
            icon: Package,
          },
        ],
      },
      {
        id: "member-package-adjust",
        title: "Adjust Packages & Session Credits",
        subtitle: "Add session credits, extend package expiration, or assign new packages",
        icon: Package,
        roles: ["management", "branch_admin"],
        keywords: [
          "add package",
          "adjust package",
          "add classes",
          "add credits",
          "extend package",
          "extend expiration",
          "session credits",
          "subscription adjustment",
          "bonus sessions",
          "credit member",
        ],
        steps: [
          {
            title: "Member Packages Section",
            description:
              "Inside the member detail view, locate the active packages card showing current subscription balances.",
            icon: Package,
          },
          {
            title: "Add Session Credits",
            description:
              "Click 'Add Classes' or 'Add Credits' to credit bonus or make-up sessions to the member.",
            icon: Package,
          },
          {
            title: "Extend Expiration Date",
            description:
              "Use 'Extend Package' to prolong the validity date for injured or traveling members.",
            icon: CalendarDays,
          },
        ],
      },
      {
        id: "member-requests-triage",
        title: "Triage Member Sign-Up Requests",
        subtitle: "Review app sign-ups, assign branches, and promote users to active members",
        icon: UserPlus,
        roles: ["management", "branch_admin"],
        keywords: [
          "member requests",
          "pending members",
          "add non member package",
          "add package to non member",
          "non member package",
          "approve user",
          "promote member",
          "app signup",
          "triage requests",
          "sign up request",
          "register member",
        ],
        steps: [
          {
            title: "Pending Requests Queue",
            description:
              "Navigate to Member Requests to see new users who signed up via the mobile app.",
            icon: UserPlus,
          },
          {
            title: "Review User Details",
            description:
              "Inspect the prospective member's name, phone number, and requested branch location.",
            icon: Users,
          },
          {
            title: "Approve & Promote",
            description:
              "Click 'Approve' to promote the account to active Member status and enable mobile booking privileges.",
            icon: UserCheck,
          },
        ],
      },
    ],
  },
  {
    title: "Class Scheduling & Operations",
    scenarios: [
      {
        id: "schedule-class-wizard",
        title: "Schedule a Class Session",
        subtitle: "Create single or recurring classes, assign coaches, and configure capacities",
        icon: CalendarDays,
        roles: ["management", "branch_admin"],
        keywords: [
          "schedule class",
          "schedule a class",
          "book class",
          "book a class",
          "create class",
          "new class",
          "assign coach",
          "class capacity",
          "recurring class",
          "calendar",
          "timetable",
        ],
        steps: [
          {
            title: "Open Schedule Manager",
            description:
              "Open the Schedule page to view the interactive weekly calendar and daily class grid.",
            icon: CalendarDays,
          },
          {
            title: "Click Schedule Class",
            description:
              "Click the '+ Schedule Class' button to launch the scheduling wizard modal.",
            icon: CalendarDays,
          },
          {
            title: "Configure Session Details",
            description:
              "Select the class type, assign a coach, set start time, room capacity, and choose recurrence options.",
            icon: CalendarDays,
          },
          {
            title: "Save & Publish",
            description:
              "Submit the form to publish the class session instantly to the mobile app for member bookings.",
            icon: UserCheck,
          },
        ],
      },
      {
        id: "manage-class-waitlist",
        title: "Class Capacity & Waitlist Radar",
        subtitle: "Inspect attendees, promote waitlisted members, and cancel class slots",
        icon: Users,
        roles: ["management", "branch_admin"],
        keywords: [
          "waitlist",
          "class roster",
          "manage waitlist",
          "promote waitlist",
          "capacity",
          "attendees",
          "cancel class",
          "booked members",
        ],
        steps: [
          {
            title: "Select Scheduled Class",
            description:
              "Click on any scheduled class card in the calendar to view its enrolled member roster.",
            icon: CalendarDays,
          },
          {
            title: "Waitlist Inspection",
            description:
              "If a class is fully booked, check the waitlisted members queue ordered by registration time.",
            icon: Users,
          },
          {
            title: "Manual Promotion Override",
            description:
              "Front desk staff can manually promote a waitlisted member if a spot becomes available.",
            icon: UserCheck,
          },
        ],
      },
    ],
  },
  {
    title: "Catalog & Services",
    scenarios: [
      {
        id: "catalog-management",
        title: "Catalog: Classes, Packages & Coaches",
        subtitle: "Configure gym class types, membership packages, and trainer profiles",
        icon: Layers,
        roles: ["management", "branch_admin"],
        keywords: [
          "catalog",
          "classes tab",
          "packages tab",
          "coaches tab",
          "create class",
          "create package",
          "add package",
          "add coach",
          "pricing",
          "memberships",
          "bundle",
        ],
        steps: [
          {
            title: "Catalog Hub",
            description:
              "Open Catalog to manage gym offerings divided into Classes, Packages, and Coaches tabs.",
            icon: Layers,
          },
          {
            title: "Classes Tab",
            description:
              "Create or edit class types, intensity levels, durations, and descriptions displayed on mobile.",
            icon: CalendarDays,
          },
          {
            title: "Packages Tab",
            description:
              "Define membership packages, credit counts, validity durations, prices, and branch restrictions.",
            icon: Package,
          },
          {
            title: "Coaches Tab",
            description:
              "Manage trainer profiles, biography text, profile pictures, and specialties.",
            icon: Users,
          },
        ],
      },
    ],
  },
  {
    title: "Retail POS & Inventory",
    scenarios: [
      {
        id: "pos-checkout-flow",
        title: "Retail Point-of-Sale Checkout",
        subtitle: "Scan barcodes, build cart, apply branch context, and complete retail sales",
        icon: ShoppingCart,
        roles: ["management", "branch_admin"],
        keywords: [
          "pos",
          "checkout",
          "retail",
          "scan barcode",
          "barcode",
          "shopping cart",
          "complete order",
          "sell product",
          "store checkout",
          "water",
          "shake",
        ],
        steps: [
          {
            title: "Point-of-Sale Terminal",
            description:
              "Navigate to Checkout for retail sales of water, protein shakes, apparel, and supplements.",
            icon: ShoppingCart,
          },
          {
            title: "Scan or Type Barcode",
            description:
              "Use a USB/Bluetooth barcode scanner or type the barcode in the input to add items to the cart.",
            icon: Barcode,
          },
          {
            title: "Adjust Quantities & Review",
            description:
              "Adjust item quantities, review line item totals, and check subtotal calculation.",
            icon: ShoppingCart,
          },
          {
            title: "Complete Sale",
            description:
              "Click 'Complete Order' to record the transaction and deduct stock from product inventory.",
            icon: CreditCard,
          },
        ],
      },
      {
        id: "products-inventory",
        title: "Product Inventory & Stock",
        subtitle: "Track retail inventory, manage barcodes, wholesale costs, and retail prices",
        icon: Barcode,
        roles: ["management", "branch_admin"],
        keywords: [
          "products",
          "inventory",
          "stock",
          "add product",
          "wholesale cost",
          "retail price",
          "barcode sku",
          "low stock",
          "retail inventory",
        ],
        steps: [
          {
            title: "Products Catalog",
            description:
              "Navigate to Products to view all retail items, current stock quantities, and pricing.",
            icon: Barcode,
          },
          {
            title: "Add / Edit Product",
            description:
              "Register new products with SKU barcode, product name, brand, cost, and selling price.",
            icon: Package,
          },
          {
            title: "Stock Level Tracking",
            description:
              "Monitor low stock levels to re-order inventory before retail supplies run out.",
            icon: Layers,
          },
        ],
      },
      {
        id: "orders-receipts",
        title: "Sales Orders & Receipts",
        subtitle: "Inspect completed POS orders, line item breakdowns, and void transactions",
        icon: Receipt,
        roles: ["management", "branch_admin"],
        keywords: [
          "orders",
          "receipts",
          "sales receipt",
          "pos orders",
          "order history",
          "void order",
          "sales log",
        ],
        steps: [
          {
            title: "Orders Log",
            description:
              "Open Orders to see historical retail sales filtered by date and branch.",
            icon: Receipt,
          },
          {
            title: "Inspect Order Details",
            description:
              "Click on any order to view receipt items, timestamps, staff cashier, and total amounts.",
            icon: Receipt,
          },
        ],
      },
    ],
  },
  {
    title: "Financials & Refunds",
    scenarios: [
      {
        id: "payments-ledger",
        title: "Payments & Financial Transactions",
        subtitle: "Search transactions across Geidea online payments, POS cash, and cards",
        icon: DollarSign,
        roles: ["management", "branch_admin"],
        keywords: [
          "payments",
          "transactions",
          "payment ledger",
          "cash",
          "pos card",
          "geidea",
          "drop-in payment",
          "financial log",
          "audit transactions",
        ],
        steps: [
          {
            title: "Payments Ledger",
            description:
              "Open Payments to view all financial transactions recorded across mobile and in-gym checkouts.",
            icon: DollarSign,
          },
          {
            title: "Filter by Date & Method",
            description:
              "Filter logs by date range and payment method (Cash, POS Card, Geidea Online, Drop-in).",
            icon: CreditCard,
          },
        ],
      },
      {
        id: "process-refunds",
        title: "Process Refunds & Front-Desk Cashouts",
        subtitle: "Issue package refunds, revoke sessions, and record authorized till disbursements",
        icon: Undo2,
        roles: ["management", "branch_admin"],
        keywords: [
          "refund",
          "process refund",
          "member refund",
          "cash out",
          "cashout",
          "till cash",
          "revoke sessions",
          "disbursement",
          "petty cash",
        ],
        steps: [
          {
            title: "Refunds Module",
            description:
              "Navigate to Refunds to process customer refund requests and front-desk cashouts.",
            icon: Undo2,
          },
          {
            title: "Member Refund Calculation",
            description:
              "Calculate eligible refund balance and automatically revoke unused package session credits.",
            icon: DollarSign,
          },
          {
            title: "Till Cashout Logging",
            description:
              "Log authorized front-desk cash disbursements for facility petty cash or emergency expenses.",
            icon: CreditCard,
          },
        ],
      },
    ],
  },
  {
    title: "Support & Communications",
    scenarios: [
      {
        id: "support-tickets-resolution",
        title: "Support Tickets & Helpdesk",
        subtitle: "Manage member and coach issues, update status, and add internal staff notes",
        icon: Ticket,
        roles: ["management", "branch_admin"],
        keywords: [
          "tickets",
          "support ticket",
          "helpdesk",
          "resolve ticket",
          "ticket status",
          "internal notes",
          "member inquiry",
          "coach ticket",
          "customer support",
        ],
        steps: [
          {
            title: "Support Tickets Inbox",
            description:
              "Navigate to Tickets to view inquiries and complaints submitted by app members and coaches.",
            icon: Ticket,
          },
          {
            title: "Ticket Details & History",
            description:
              "Click on a ticket to view the submitted problem category, user details, and full message.",
            icon: Users,
          },
          {
            title: "Status Transitions & Notes",
            description:
              "Update ticket status from Open to In Progress or Resolved, and add internal staff notes.",
            icon: UserCheck,
          },
        ],
      },
      {
        id: "ticket-categories-management",
        title: "Manage Problem Categories",
        subtitle: "Configure support categories and target audience roles dynamically",
        icon: Tags,
        roles: ["management"],
        badge: "Management",
        keywords: [
          "ticket categories",
          "problem categories",
          "manage categories",
          "support category",
          "audience roles",
          "configure tickets",
        ],
        steps: [
          {
            title: "Problem Categories Console",
            description:
              "As management, you can define the dropdown problem categories available on mobile.",
            icon: Tags,
          },
          {
            title: "Create / Edit Category",
            description:
              "Add new categories (e.g. Facilities, Billing, App Feedback) and specify target audience roles.",
            icon: Tags,
          },
        ],
      },
      {
        id: "email-broadcast-composer",
        title: "Compose & Broadcast Outbound Emails",
        subtitle: "Rich Brevo email composer for broadcast announcements, members, and coaches",
        icon: Send,
        roles: ["management"],
        badge: "Management",
        keywords: [
          "email broadcast",
          "broadcast email",
          "send mail",
          "compose email",
          "brevo",
          "newsletter",
          "mail members",
          "mail coaches",
          "mass email",
        ],
        steps: [
          {
            title: "Mailing Composer",
            description:
              "Open Mail > Compose to launch the rich email composer powered by the Brevo transactional API.",
            icon: Send,
          },
          {
            title: "Select Send Mode",
            description:
              "Choose between Broadcast (All active members & coaches), Members Only, Coaches Only, or Manual recipient emails.",
            icon: Users,
          },
          {
            title: "Subject, Body & Attachments",
            description:
              "Compose your announcement subject, rich text body, and optional PDF/image attachments.",
            icon: Mail,
          },
          {
            title: "Send Confirmation",
            description:
              "Review the recipient count and dispatch the outbound email safely.",
            icon: Send,
          },
        ],
      },
      {
        id: "inbox-sent-logs",
        title: "IMAP Synced Inbox & Sent Mail Delivery Logs",
        subtitle: "Review incoming client replies and inspect outbound delivery audit trails",
        icon: Inbox,
        roles: ["management"],
        badge: "Management",
        keywords: [
          "inbox",
          "sent mail",
          "imap",
          "email replies",
          "delivery logs",
          "mail audit",
          "received mail",
        ],
        steps: [
          {
            title: "Synced Inbox",
            description:
              "Navigate to Mail > Inbox to read incoming emails received via the background IMAP worker.",
            icon: Inbox,
          },
          {
            title: "Sent Mail Audit Trail",
            description:
              "Open Mail > Sent to verify delivery timestamps, recipient email addresses, and dispatch statuses.",
            icon: Send,
          },
        ],
      },
    ],
  },
];

export function findTutorialScenario(id: string): TutorialScenario | undefined {
  for (const section of tutorialSections) {
    for (const scenario of section.scenarios) {
      if (scenario.id === id) return scenario;
    }
  }
  return undefined;
}

export function getTutorialSectionsForRole(
  role: string | undefined
): TutorialSection[] {
  const permRole: PermissionRole =
    role === "branch_admin" ? "branch_admin" : "management";

  return tutorialSections
    .map((section) => ({
      ...section,
      scenarios: section.scenarios.filter((s) => s.roles.includes(permRole)),
    }))
    .filter((section) => section.scenarios.length > 0);
}
