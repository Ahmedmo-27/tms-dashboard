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
  Snowflake,
  Clock,
  RotateCcw,
  Search,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Home,
  ScanLine,
  Calendar,
  Download,
  Filter,
  Paperclip,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PermissionRole } from "@/lib/config/roles";

export type TutorialRole = PermissionRole | "coach" | "managing_coach";

export type IconComponent = ComponentType<{ className?: string }>;

export interface TutorialStep {
  title: string;
  description: string;
  icon?: IconComponent;
  requiresPt?: boolean;
}

export interface TutorialScenario {
  id: string;
  title: string;
  subtitle: string;
  icon: IconComponent;
  roles: readonly TutorialRole[];
  badge?: string;
  keywords?: string[];
  steps: TutorialStep[];
  requiresPt?: boolean;
}

export interface TutorialSection {
  title: string;
  roles?: readonly TutorialRole[];
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
      {
        id: "package-freeze-management",
        title: "Package Freeze & Early Unfreeze",
        subtitle: "Overview frozen memberships, search by member, initiate manual freezes, and lift freezes early",
        icon: Snowflake,
        roles: ["management", "branch_admin"],
        badge: "Freeze",
        keywords: [
          "freeze",
          "package freeze",
          "unfreeze",
          "freeze member",
          "pause package",
          "hold package",
          "freeze subscription",
          "lift freeze",
          "freeze days",
          "early unfreeze",
          "package freezes",
          "freeze history",
          "frozen packages",
        ],
        steps: [
          {
            title: "Freeze Overview & Metrics",
            description:
              "Review high-level metrics for currently frozen subscriptions, pending requests, and approval counts.",
            icon: Snowflake,
          },
          {
            title: "Freeze a Member Package",
            description:
              "Search any member, pick their active package, and apply a freeze period (days or weeks) with an admin note.",
            icon: Snowflake,
          },
          {
            title: "Search & Filter Roster",
            description:
              "Search frozen subscriptions by member name or phone to quickly locate specific memberships on hold.",
            icon: Search,
          },
          {
            title: "Frozen Package Details",
            description:
              "Inspect remaining freeze days countdown, recalculated package expiration dates, and freeze reasons.",
            icon: Package,
          },
          {
            title: "Early Unfreeze & Quota Refund",
            description:
              "Lift freezes early when members return. Unused days are automatically credited back to their freeze allowance.",
            icon: RotateCcw,
          },
        ],
      },
      {
        id: "freeze-requests-triage",
        title: "Triage Extra Freeze Requests",
        subtitle: "Review member freeze requests, evaluate justifications, and approve with custom duration or reject",
        icon: Clock,
        roles: ["management", "branch_admin"],
        badge: "Requests",
        keywords: [
          "freeze requests",
          "extra freeze",
          "approve freeze",
          "reject freeze",
          "member freeze request",
          "pending freeze",
          "freeze extension",
          "freeze reason",
          "triage freeze",
          "package freeze requests",
        ],
        steps: [
          {
            title: "Extra Freeze Queue",
            description:
              "Switch to the Extra Freeze Requests tab to inspect member submissions from the mobile app.",
            icon: Clock,
          },
          {
            title: "Filter Statuses",
            description:
              "Filter between Pending submissions awaiting decision, Approved extensions, or Rejected history.",
            icon: Layers,
          },
          {
            title: "Inspect Justifications",
            description:
              "Review the member profile, requested hold days, and submitted reason notes (e.g. travel, injury, exams).",
            icon: Users,
          },
          {
            title: "Approve or Reject",
            description:
              "Approve with full or adjusted duration and admin note, or decline with a clear member-facing reason.",
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
            title: "Financial Summary",
            description:
              "Review aggregate revenue in EGP, transaction counts, and period refund/outflow statistics.",
            icon: DollarSign,
          },
          {
            title: "Pick Payment Periods",
            description:
              "Filter transactions by custom periods (e.g. from 7/5/2026 to 4/9/2026) or quick presets (Today, Yesterday, Last 7 Days, This Month, Last Month).",
            icon: Calendar,
          },
          {
            title: "Filter by Type & Method",
            description:
              "Narrow down by search keywords, transaction type (Payments Only vs. Refunds & Cash Outs), or payment method (Cash, Visa, Instapay, ValU).",
            icon: Filter,
          },
          {
            title: "Inspect Transactions",
            description:
              "Browse member details, amounts, locations, and transaction status in the live ledger.",
            icon: CreditCard,
          },
          {
            title: "Export & Spreadsheet Copy",
            description:
              "Export the active payment period to Excel or copy tab-separated rows for Google Sheets.",
            icon: Download,
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
        roles: ["management", "mailer", "managing_coach"],
        badge: "Communications",
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
          "mailing",
        ],
        steps: [
          {
            title: "Audience Selection",
            description:
              "Choose between Direct (manual email addresses), Broadcast All, Active Members only, or Coaches only.",
            icon: Users,
          },
          {
            title: "Subject & Topic",
            description:
              "Set a clear subject line and use optional tags like [Announcement] or [Urgent] for priority.",
            icon: Tags,
          },
          {
            title: "Message Body & Formatting",
            description:
              "Draft your content with bold, italics, bullet lists, headings, and CTA button links, or pick a template.",
            icon: Sparkles,
          },
          {
            title: "File Attachments",
            description:
              "Attach PDF documents, schedules, or image assets up to 5MB directly to your outbound message.",
            icon: Paperclip,
          },
          {
            title: "Review & Dispatch",
            description:
              "Click Send Mail to review the confirmation preview with recipient counts and dispatch via Brevo.",
            icon: Send,
          },
        ],
      },
      {
        id: "inbox-sent-logs",
        title: "IMAP Synced Inbox & Sent Mail Delivery Logs",
        subtitle: "Review incoming client replies and inspect outbound delivery audit trails",
        icon: Inbox,
        roles: ["management", "mailer", "managing_coach"],
        badge: "Communications",
        keywords: [
          "inbox",
          "sent mail",
          "imap",
          "email replies",
          "delivery logs",
          "mail audit",
          "received mail",
          "mailing",
        ],
        steps: [
          {
            title: "Mail Server Sync",
            description:
              "Click 'Sync Mailbox' to immediately query the IMAP mail server for new incoming inquiries or member replies.",
            icon: RotateCcw,
          },
          {
            title: "Search & Unread Filters",
            description:
              "Search by sender, subject, or keywords, or filter to unread messages to stay on top of communications.",
            icon: Search,
          },
          {
            title: "Inbox Messages & Direct Reply",
            description:
              "Review incoming emails in the table, open full message preview, copy addresses, or click Reply to compose an answer.",
            icon: Inbox,
          },
          {
            title: "Sent Delivery Metrics",
            description:
              "Navigate to Mail > Sent to monitor total messages, delivered count, delivery failures, and broadcasts.",
            icon: Layers,
          },
          {
            title: "Sent Audit Trail & Diagnostics",
            description:
              "Inspect every outbound email dispatch, recipient counts, timestamps, and failure error messages.",
            icon: Send,
          },
        ],
      },
    ],
  },
  {
    title: "Coach Operations & Daily Hub",
    roles: ["coach", "managing_coach"],
    scenarios: [
      {
        id: "coach-today-overview",
        title: "Coach Overview & Today's Hub",
        subtitle: "Quick access to next session, daily timetable, scan totals, and expiring PT alerts",
        icon: Home,
        roles: ["coach", "managing_coach"],
        badge: "Daily Hub",
        keywords: [
          "today",
          "next session",
          "coach dashboard",
          "classes today",
          "pt alerts",
          "overview",
          "quick summary",
          "scans summary",
        ],
        steps: [
          {
            title: "Next Session Spotlight",
            description:
              "Track your immediate upcoming class, scheduled room, timing, and current booking count right from the top card.",
            icon: Clock,
          },
          {
            title: "Today's Schedule & Roster",
            description:
              "View all classes assigned to you today. Click on any class to instantly view the booked attendee list and contact info.",
            icon: Calendar,
          },
          {
            title: "Daily Scans & Activity Summary",
            description:
              "Monitor today's check-ins, failed scans, and will-pay alerts. Jump straight into the Scans Monitor for real-time details.",
            icon: ScanLine,
          },
          {
            title: "Personal Training Attention",
            description:
              "Spot clients with low remaining sessions (<= 2) or packages expiring soon (<= 14 days) so you can arrange renewals.",
            icon: AlertTriangle,
            requiresPt: true,
          },
        ],
      },
      {
        id: "coach-attendance-confirmation",
        title: "Class Attendance Headcount Confirmation",
        subtitle: "Confirm live attendee headcount at the session halfway mark with notes & missing place alerts",
        icon: ClipboardCheck,
        roles: ["coach", "managing_coach"],
        badge: "Attendance",
        keywords: [
          "attendance",
          "headcount",
          "confirm attendance",
          "halfway",
          "missing place",
          "class headcount",
          "session attendance",
          "roll call",
          "confirm headcount",
        ],
        steps: [
          {
            title: "Halfway Mark Requirement",
            description:
              "Attendance headcount confirmation unlocks dynamically once the session reaches its halfway point (start + half duration).",
            icon: Clock,
          },
          {
            title: "Open Confirmation Dialog",
            description:
              "Click 'Confirm Attendance' on the class card in Scans Monitor. The button highlights in primary green once unlocked.",
            icon: ClipboardCheck,
          },
          {
            title: "Count Present Trainees",
            description:
              "Verify the physical headcount in the studio. Use the count stepper to match the actual number of attendees.",
            icon: Users,
          },
          {
            title: "Flag Missing Places & Notes",
            description:
              "Check 'Missing Place' if any booked attendees failed to show up, and add optional session notes for gym management.",
            icon: AlertTriangle,
          },
          {
            title: "Live Confirmation Sync",
            description:
              "Upon submitting, the class status updates instantly across all connected screens with verified count badges.",
            icon: CheckCircle2,
          },
        ],
      },
      {
        id: "coach-class-schedule-roster",
        title: "Weekly Schedule & Attendee Rosters",
        subtitle: "Browse weekly class timetables, day-by-day views, and registered member lists",
        icon: CalendarDays,
        roles: ["coach", "managing_coach"],
        badge: "Schedule",
        keywords: [
          "schedule",
          "calendar",
          "week schedule",
          "class roster",
          "booked clients",
          "registered members",
          "capacity",
          "day view",
          "clients modal",
        ],
        steps: [
          {
            title: "Week-by-Week Navigation",
            description:
              "Navigate previous and future weeks using the week picker to review upcoming bookings or past session attendance.",
            icon: CalendarDays,
          },
          {
            title: "Day Tabs Selector",
            description:
              "Switch between individual days of the week to inspect your daily class lineup and break times.",
            icon: Clock,
          },
          {
            title: "Class Session Details",
            description:
              "Review each session card showing category, start/end times, room location, and capacity ratio (e.g. 8/12 booked).",
            icon: Layers,
          },
          {
            title: "Attendee Roster & Contacts",
            description:
              "Click any class to launch the Session Clients modal, displaying booked member names, phone numbers, and active packages.",
            icon: Users,
          },
        ],
      },
      {
        id: "coach-scans-radar",
        title: "Live Check-in Scans Monitor",
        subtitle: "Real-time turnstile socket updates, PT attendance, and member phone peeks",
        icon: ScanBarcode,
        roles: ["coach", "managing_coach"],
        badge: "Live Radar",
        keywords: [
          "scans",
          "live radar",
          "socket",
          "turnstile",
          "pt attendance",
          "check in",
          "failed scan",
          "peek member",
          "scan monitor",
        ],
        steps: [
          {
            title: "Real-Time WebSocket Radar",
            description:
              "The Scans Monitor stays connected via WebSocket, instantly refreshing whenever a client taps in at the turnstile.",
            icon: ScanBarcode,
          },
          {
            title: "Personal Training Check-ins",
            description:
              "The top PT section displays all trainees checking in for your assigned personal training packages today.",
            icon: UserCheck,
            requiresPt: true,
          },
          {
            title: "Scheduled Class Scans",
            description:
              "Each scheduled class lists verified check-ins, exact scan times, and check-in status (Checked in, Failed, or Will Pay).",
            icon: CalendarDays,
          },
          {
            title: "Member Phone & Quick Peek",
            description:
              "Click on any check-in row to view the member's phone number, initiate a quick call, or open their client profile.",
            icon: Users,
          },
        ],
      },
      {
        id: "coach-pt-client-management",
        title: "PT Clients & Session Deductions",
        subtitle: "Search assigned clients, inspect package balances, and deduct sessions with audit notes",
        icon: UserCheck,
        roles: ["coach", "managing_coach"],
        badge: "Personal Training",
        requiresPt: true,
        keywords: [
          "clients",
          "pt clients",
          "deduct session",
          "deduction",
          "packages",
          "classes remaining",
          "audit log",
          "client search",
          "deduct",
        ],
        steps: [
          {
            title: "Client Roster Search",
            description:
              "Search your assigned personal training clients by name or phone number with instant debounced filtering.",
            icon: Search,
          },
          {
            title: "Filter by Status & Alerts",
            description:
              "Use filter chips to switch between Active and Past clients, or isolate trainees with low sessions or expiring packages.",
            icon: Layers,
          },
          {
            title: "Client Package Profile",
            description:
              "Open any client to view active packages, start/end dates, total classes, and remaining session progress bar.",
            icon: Package,
          },
          {
            title: "Deduct Completed Session",
            description:
              "Click 'Deduct' on the package to record a completed workout. Enter session date and a mandatory audit reason.",
            icon: UserCheck,
          },
          {
            title: "Deduction Audit Trail",
            description:
              "Review the transparent deduction history log recording every session deduction timestamp and reason.",
            icon: Clock,
          },
        ],
      },
      {
        id: "coach-tickets-support",
        title: "Support & Equipment Tickets",
        subtitle: "Report equipment breakdowns, room maintenance, or scheduling issues directly to management",
        icon: Ticket,
        roles: ["coach", "managing_coach"],
        badge: "Support",
        keywords: [
          "tickets",
          "support ticket",
          "broken equipment",
          "maintenance",
          "helpdesk",
          "report issue",
          "management ticket",
          "new ticket",
        ],
        steps: [
          {
            title: "Coach Tickets Dashboard",
            description:
              "View all your operational and maintenance requests categorized by Pending, In Progress, Resolved, or Rejected.",
            icon: Ticket,
          },
          {
            title: "Submit New Ticket",
            description:
              "Click '+ New Ticket' to submit repair requests (e.g. treadmill maintenance, AC issue, missing props) or schedule questions.",
            icon: Ticket,
          },
          {
            title: "Live Resolution Tracking",
            description:
              "Track management responses, resolution notes, and status changes in real time.",
            icon: CheckCircle2,
          },
        ],
      },
      {
        id: "coach-mailing-broadcasts",
        title: "Managing Coach Communications",
        subtitle: "Broadcast emails, announcements, and member communications across your branch",
        icon: Mail,
        roles: ["managing_coach"],
        badge: "Managing Coach",
        keywords: [
          "mailing",
          "broadcast",
          "email",
          "announcements",
          "managing coach",
          "sent mail",
          "inbox",
        ],
        steps: [
          {
            title: "Mail Center",
            description:
              "As a Managing Coach, access the gym mailing center to coordinate with staff and send member announcements.",
            icon: Mail,
          },
          {
            title: "Compose Broadcast",
            description:
              "Draft branch updates or fitness announcements with formatted message body and dispatch to target recipients.",
            icon: Send,
          },
          {
            title: "Inbox & Sent Audit",
            description:
              "Monitor incoming email responses and inspect sent delivery logs directly inside the portal.",
            icon: Inbox,
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
  role: string | undefined,
  options?: {
    hasPtSessions?: boolean;
    hasScheduledClasses?: boolean;
  }
): TutorialSection[] {
  let effectiveRole: TutorialRole = "branch_admin";
  if (role === "managing_coach") {
    effectiveRole = "managing_coach";
  } else if (role === "coach") {
    effectiveRole = "coach";
  } else if (role === "management" || role === "admin") {
    effectiveRole = "management";
  } else if (role === "branch_admin") {
    effectiveRole = "branch_admin";
  } else if (role === "mailer" || role === "mailing") {
    effectiveRole = "mailer";
  }

  return tutorialSections
    .map((section) => ({
      ...section,
      scenarios: section.scenarios
        .filter((s) => {
          if (!s.roles.includes(effectiveRole)) return false;
          if (options?.hasPtSessions === false && s.requiresPt) return false;
          return true;
        })
        .map((s) => {
          if (options?.hasPtSessions === false) {
            return {
              ...s,
              steps: s.steps.filter((st) => !st.requiresPt),
            };
          }
          return s;
        }),
    }))
    .filter((section) => section.scenarios.length > 0);
}

