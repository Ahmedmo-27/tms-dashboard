export interface WalkthroughStep {
  targetSelector: string;
  route: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  blockAction?: boolean;
  openSidebar?: boolean;
  fallbackSelector?: string;
}

export const walkthroughScenarios: Record<string, WalkthroughStep[]> = {
  "dash-overview": [
    {
      targetSelector: '[data-walkthrough="sidebar-nav"]',
      route: "/dashboard/scans-monitor",
      title: "Sidebar Navigation",
      description:
        "The left sidebar gives you quick access to Front Desk, Members, Operations, Retail, Support, and Mail based on your user role.",
      placement: "right",
      fallbackSelector: "aside",
    },
    {
      targetSelector: '[data-walkthrough="header-breadcrumbs"]',
      route: "/dashboard/scans-monitor",
      title: "Breadcrumbs & Location",
      description:
        "The header bar displays your active page location and allows swift navigation back to home.",
      placement: "bottom",
    },
    {
      targetSelector: '[data-walkthrough="command-palette-btn"]',
      route: "/dashboard/scans-monitor",
      title: "Command Palette (Ctrl + K)",
      description:
        "Press Ctrl+K or click this search button to search members, non-members, jump between pages, or trigger quick actions.",
      placement: "bottom",
    },
    {
      targetSelector: '[data-walkthrough="help-btn"]',
      route: "/dashboard/scans-monitor",
      title: "Interactive Guides & Help",
      description:
        "Click the Help button anytime to browse all interactive guides or replay tutorials for any gym function.",
      placement: "bottom",
    },
  ],

  "mgmt-branch-switch": [
    {
      targetSelector: '[data-walkthrough="branch-bar"]',
      route: "/dashboard/scans-monitor",
      title: "Management Branch Bar",
      description:
        "As a Management user, you can switch the active branch context across all operational pages with this selector.",
      placement: "bottom",
      fallbackSelector: "header",
    },
    {
      targetSelector: '[data-walkthrough="branch-select-dropdown"]',
      route: "/dashboard/scans-monitor",
      title: "Select Active Branch",
      description:
        "Pick a branch (e.g. Cairo or North Coast) to immediately scope attendance, class calendars, and POS retail transactions.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="branch-bar"]',
    },
    {
      targetSelector: '[data-walkthrough="scan-attendance-pt"]',
      route: "/dashboard/scans-monitor",
      title: "Scoped Real-Time Data",
      description:
        "Notice how attendance radar, class check-ins, and daily sheets adapt instantly to your selected branch context.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "scans-monitor-flow": [
    {
      targetSelector: '[data-walkthrough="scans-live-badge"]',
      route: "/dashboard/scans-monitor",
      title: "Live Socket Status",
      description:
        "The radar stays connected to TMS turnstiles via real-time WebSocket. Green indicates connected live scan listening.",
      placement: "bottom",
    },
    {
      targetSelector: '[data-walkthrough="scans-date-picker"]',
      route: "/dashboard/scans-monitor",
      title: "Attendance Date Filter",
      description:
        "Switch dates to review historical check-in logs or preview future scheduled classes.",
      placement: "bottom",
    },
    {
      targetSelector: '[data-walkthrough="scan-attendance-pt"]',
      route: "/dashboard/scans-monitor",
      title: "Personal Training Check-ins",
      description:
        "View trainees currently checked in for one-on-one PT sessions and track deductions.",
      placement: "right",
    },
    {
      targetSelector: '[data-walkthrough="scan-attendance-opengym"]',
      route: "/dashboard/scans-monitor",
      title: "Open Gym Check-ins",
      description:
        "Monitor walk-ins and active gym members utilizing open gym facilities.",
      placement: "left",
    },
    {
      targetSelector: '[data-walkthrough="scans-upcoming-classes"]',
      route: "/dashboard/scans-monitor",
      title: "Upcoming Classes Grid",
      description:
        "Today's scheduled classes appear here showing enrolled capacity, attendee list, and coach assignments.",
      placement: "top",
    },
  ],

  "quick-actions-walkin": [
    {
      targetSelector: '[data-walkthrough="scans-quick-actions"]',
      route: "/dashboard/scans-monitor",
      title: "Quick Actions Menu",
      description:
        "Click Quick Actions to quickly handle front-desk reception workflows without navigating away.",
      placement: "bottom",
    },
    {
      targetSelector: '[data-walkthrough="scans-quick-actions"]',
      route: "/dashboard/scans-monitor",
      title: "Drop-ins & Subscriptions",
      description:
        "Select 'Open gym drop-in' to sell a day pass or 'Subscribe to open gym' to assign a package directly.",
      placement: "bottom",
    },
  ],

  "qr-code-generation": [
    {
      targetSelector: '[data-walkthrough="qr-type-selector"]',
      route: "/dashboard/qr-codes",
      title: "Select QR Type",
      description:
        "Choose between Branch Entrance Turnstile QR or Class Check-in QR code generation.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="qr-preview-card"]',
      route: "/dashboard/qr-codes",
      title: "QR Code Preview & Export",
      description:
        "Download or print the high-definition QR code poster for front-desk turnstiles or studio doors.",
      placement: "left",
      fallbackSelector: "main",
    },
  ],

  "member-directory-management": [
    {
      targetSelector: '[data-walkthrough="member-search-bar"]',
      route: "/dashboard/our-members",
      title: "Search Member Database",
      description:
        "Type a member's name, phone number, or email to find their profile across all gym branches.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="members-table"]',
      route: "/dashboard/our-members",
      title: "Member Roster",
      description:
        "Click any member in this table to open their complete subscription details, remaining sessions, and check-in timeline.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "member-package-adjust": [
    {
      targetSelector: '[data-walkthrough="member-search-bar"]',
      route: "/dashboard/our-members",
      title: "Locate Member Profile",
      description:
        "First search and open the member's profile from the Member Directory.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="members-table"]',
      route: "/dashboard/our-members",
      title: "Inspect Active Packages",
      description:
        "Inside the member's detail page, click 'Add Classes' to grant credits or 'Extend Package' to prolong validity.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "member-requests-triage": [
    {
      targetSelector: '[data-walkthrough="member-requests-search"]',
      route: "/dashboard/member-requests?searchString=&page=1",
      title: "Pending Sign-ups",
      description:
        "Filter and review prospective members who registered an account via the mobile app.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="member-requests-table"]',
      route: "/dashboard/member-requests?searchString=&page=1",
      title: "Approve & Promote",
      description:
        "Review prospective members, assign their primary branch, and approve their account to enable class bookings.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "schedule-class-wizard": [
    {
      targetSelector: '[data-walkthrough="schedule-calendar-header"]',
      route: "/dashboard/schedule",
      title: "Interactive Schedule Calendar",
      description:
        "Browse the weekly and daily class calendar across studio rooms and coaches.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="schedule-add-class-btn"]',
      route: "/dashboard/schedule",
      title: "Schedule Class Button",
      description:
        "Click '+ Schedule Class' to launch the scheduling wizard.",
      placement: "bottom",
      fallbackSelector: "main",
    },
  ],

  "manage-class-waitlist": [
    {
      targetSelector: '[data-walkthrough="schedule-calendar-grid"]',
      route: "/dashboard/schedule",
      title: "Class Slots & Attendance",
      description:
        "Select any scheduled class card to view enrolled members and check capacity limits.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "catalog-management": [
    {
      targetSelector: '[data-walkthrough="catalog-tabs"]',
      route: "/dashboard/catalog",
      title: "Catalog Categories",
      description:
        "Switch between Classes (workout types), Packages (membership subscriptions), and Coaches (trainer profiles).",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="catalog-add-btn"]',
      route: "/dashboard/catalog",
      title: "Add New Catalog Item",
      description:
        "Click to create a new class type, subscription bundle, or coach trainer bio.",
      placement: "left",
      fallbackSelector: "main",
    },
  ],

  "pos-checkout-flow": [
    {
      targetSelector: '[data-walkthrough="pos-barcode-input"]',
      route: "/dashboard/checkout",
      title: "Barcode Scanner & Input",
      description:
        "Scan any product barcode with your scanner or type it manually and click Add to place it in the cart.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="pos-cart-card"]',
      route: "/dashboard/checkout",
      title: "Live Cart & Quantities",
      description:
        "Adjust quantities (+/-), inspect line item prices, or remove items from the retail order.",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="pos-complete-order-btn"]',
      route: "/dashboard/checkout",
      title: "Complete Order",
      description:
        "Click Complete Order to record the payment, log the order receipt, and deduct retail stock.",
      placement: "left",
      fallbackSelector: "main",
    },
  ],

  "products-inventory": [
    {
      targetSelector: '[data-walkthrough="products-table"]',
      route: "/dashboard/products",
      title: "Products Inventory Roster",
      description:
        "Track stock levels for water bottles, protein powders, gym straps, and branded apparel.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "orders-receipts": [
    {
      targetSelector: '[data-walkthrough="orders-table"]',
      route: "/dashboard/orders",
      title: "Historical POS Receipts",
      description:
        "Audit completed retail orders, inspect customer receipts, and verify payment totals.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "payments-ledger": [
    {
      targetSelector: '[data-walkthrough="payments-table"]',
      route: "/dashboard/payments",
      title: "Financial Transactions Ledger",
      description:
        "Comprehensive searchable log of all package purchases, drop-ins, and POS checkouts.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "process-refunds": [
    {
      targetSelector: '[data-walkthrough="refunds-container"]',
      route: "/dashboard/refunds",
      title: "Refunds & Front-Desk Cashouts",
      description:
        "Issue member package refunds with automatic credit revocation or log front-desk till disbursements.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "support-tickets-resolution": [
    {
      targetSelector: '[data-walkthrough="tickets-container"]',
      route: "/dashboard/tickets",
      title: "Support Tickets Helpdesk",
      description:
        "Review incoming member and coach inquiries, change ticket status, and record internal notes.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "ticket-categories-management": [
    {
      targetSelector: '[data-walkthrough="tickets-container"]',
      route: "/dashboard/tickets",
      title: "Dynamic Problem Categories",
      description:
        "As Management, you can configure the problem category list and target audience roles available in mobile support forms.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "email-broadcast-composer": [
    {
      targetSelector: '[data-walkthrough="mail-send-mode"]',
      route: "/dashboard/mailing",
      title: "Send Mode Selector",
      description:
        "Choose to send a broadcast to all active members & coaches, members only, coaches only, or manual email addresses.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="mail-compose-form"]',
      route: "/dashboard/mailing",
      title: "Rich Email Composer",
      description:
        "Draft your announcement subject, body, and attach documents or schedule flyers.",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="mail-send-btn"]',
      route: "/dashboard/mailing",
      title: "Dispatch Broadcast",
      description:
        "Click Send Email to preview the recipient count in a confirmation dialog and dispatch via Brevo.",
      placement: "left",
      fallbackSelector: "main",
    },
  ],

  "inbox-sent-logs": [
    {
      targetSelector: '[data-walkthrough="sidebar-nav"]',
      route: "/dashboard/mailing/received",
      title: "Synced IMAP Inbox",
      description:
        "Read client email replies sent to the gym address directly inside the dashboard.",
      placement: "right",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="sidebar-nav"]',
      route: "/dashboard/mailing/sent",
      title: "Sent Mail Audit Trail",
      description:
        "Review outbound broadcast delivery timestamps, recipient lists, and delivery confirmation statuses.",
      placement: "right",
      fallbackSelector: "main",
    },
  ],
};
