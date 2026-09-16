export interface WalkthroughStep {
  targetSelector: string;
  route: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  blockAction?: boolean;
  openSidebar?: boolean;
  fallbackSelector?: string;
  requiresPt?: boolean;
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
      targetSelector: '[data-walkthrough="payments-stats"]',
      route: "/dashboard/payments",
      title: "Financial Overview & Metrics",
      description:
        "Track total revenue in EGP, successful payments, unique paying members, and dynamic today's receipts or period refunds & outflows.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="payments-date-filter"]',
      route: "/dashboard/payments",
      title: "Payment Period & Date Range Filter",
      description:
        "Select custom payment periods (e.g. from 7/5/2026 to 4/9/2026) using the interactive dual calendar, or quickly jump to presets like Today, Yesterday, Last 7 Days, This Month, or Last Month. Click Apply to confirm your selection.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="payments-search-filter"]',
      route: "/dashboard/payments",
      title: "Search & Categorization",
      description:
        "Search payments by member name, phone, purpose, or reason. Filter by transaction type (Payments Only vs. Refunds & Cash Outs) or payment method (Cash, Visa, Instapay, ValU, App).",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="payments-table"]',
      route: "/dashboard/payments",
      title: "Transaction Ledger Table",
      description:
        "Audit recorded transactions with exact Cairo timestamp, amount, payment method badge, purpose, and branch location.",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="payments-export-btn"]',
      route: "/dashboard/payments",
      title: "Export & Spreadsheet Tools",
      description:
        "Download an Excel report pre-filled with your active date range across selected branches, or copy formatted data directly for Google Sheets.",
      placement: "bottom",
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

  "package-freeze-management": [
    {
      targetSelector: '[data-walkthrough="freeze-overview-stats"]',
      route: "/dashboard/package-freezes",
      title: "Freeze Statistics & Metrics",
      description:
        "Monitor the total number of packages currently on hold, pending extra freeze requests, and approval history across the gym.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="admin-freeze-btn"]',
      route: "/dashboard/package-freezes",
      title: "Freeze a Member Package",
      description:
        "Click 'Freeze a Package' to manually search for a member, choose an active subscription, and set a custom freeze duration (in days or weeks) with an optional note.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="freeze-overview-stats"]',
    },
    {
      targetSelector: '[data-walkthrough="frozen-packages-search"]',
      route: "/dashboard/package-freezes",
      title: "Search Frozen Subscriptions",
      description:
        "Search currently frozen subscriptions by member name or phone number to quickly locate paused accounts.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="frozen-packages-table"]',
    },
    {
      targetSelector: '[data-walkthrough="frozen-packages-table"]',
      route: "/dashboard/package-freezes",
      title: "Active Frozen Packages Roster",
      description:
        "Inspect the freeze duration dates, remaining days countdown, updated package expiration date, and freeze reason.",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="unfreeze-action-btn"]',
      route: "/dashboard/package-freezes",
      title: "Early Unfreeze & Quota Refund",
      description:
        "When a member resumes workouts early, click Unfreeze. TMS automatically refunds unused freeze days back to the member's quota and shifts expiry accordingly.",
      placement: "left",
      fallbackSelector: '[data-walkthrough="frozen-packages-table"]',
    },
  ],

  "freeze-requests-triage": [
    {
      targetSelector: '[data-walkthrough="freeze-requests-tab-trigger"]',
      route: "/dashboard/package-freezes?tab=freeze-requests",
      title: "Extra Freeze Requests Queue",
      description:
        "Switch to Extra Freeze Requests to triage requests submitted by members through the mobile application when they need extra hold days beyond default allowances.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="freeze-tabs-list"]',
    },
    {
      targetSelector: '[data-walkthrough="freeze-status-filter"]',
      route: "/dashboard/package-freezes?tab=freeze-requests",
      title: "Filter by Request Status",
      description:
        "Filter between Pending submissions awaiting decision, Approved requests, or Rejected historical requests.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="freeze-requests-table"]',
    },
    {
      targetSelector: '[data-walkthrough="freeze-requests-table"]',
      route: "/dashboard/package-freezes?tab=freeze-requests",
      title: "Review Member Requests & Justifications",
      description:
        "Inspect the member's profile, package details, requested duration, and submitted justification (e.g. medical note, travel, or exams).",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="freeze-request-actions"]',
      route: "/dashboard/package-freezes?tab=freeze-requests",
      title: "Approve or Reject with Custom Duration",
      description:
        "Click Approve to accept or customize the granted freeze days and add an admin note, or click Reject with an explanation for the member.",
      placement: "left",
      fallbackSelector: '[data-walkthrough="freeze-requests-table"]',
    },
  ],

  "coach-today-overview": [
    {
      targetSelector: '[data-walkthrough="coach-today-next"]',
      route: "/coach/today",
      title: "Next Session Spotlight",
      description:
        "Your upcoming class appears right at the top, showing scheduled time, room location, and enrolled capacity so you know where you need to be next.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-today-classes"]',
      route: "/coach/today",
      title: "Today's Schedule & Roster",
      description:
        "All of your classes scheduled for today are listed here. Click on any class to immediately open the attendee roster modal or navigate to its live check-in scan.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-today-scans"]',
      route: "/coach/today",
      title: "Daily Scans & Activity Summary",
      description:
        "Review today's total turnstile check-ins, failed access scans, and will-pay alerts. Click 'Open scans' to jump straight into the live radar.",
      placement: "right",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-today-pt-alerts"]',
      route: "/coach/today",
      title: "Personal Training Attention",
      description:
        "Highlights trainees with only 1 or 2 sessions remaining or packages expiring within 14 days, prompting timely renewals.",
      placement: "top",
      fallbackSelector: "main",
      requiresPt: true,
    },
  ],

  "coach-attendance-confirmation": [
    {
      targetSelector: '[data-walkthrough="coach-scans-header"]',
      route: "/coach/scans",
      title: "Live Scans & Date Selector",
      description:
        "Use the date picker and quick 'Today' button to inspect check-ins. Real-time sockets update this screen automatically as members tap turnstiles.",
      placement: "bottom",
      fallbackSelector: "header",
    },
    {
      targetSelector: '[data-walkthrough="coach-class-scan-card"]',
      route: "/coach/scans",
      title: "Scheduled Class Card",
      description:
        "Each class displays enrolled member check-ins, category, timing, and attendance confirmation badges.",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-confirm-attendance-btn"]',
      route: "/coach/scans",
      title: "Halfway Headcount Confirmation",
      description:
        "Once your class reaches its halfway mark, the 'Confirm Attendance' button unlocks. Click it to verify physical studio headcount, flag missing places, and submit audit notes.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="coach-class-scan-card"]',
    },
    {
      targetSelector: '[data-walkthrough="coach-class-scans-table"]',
      route: "/coach/scans",
      title: "Attendee Verification List",
      description:
        "Review each attendee's check-in timestamp and status (Checked in, Failed, or Will Pay) to confirm who arrived in the studio.",
      placement: "top",
      fallbackSelector: '[data-walkthrough="coach-class-scan-card"]',
    },
  ],

  "coach-class-schedule-roster": [
    {
      targetSelector: '[data-walkthrough="coach-calendar-week-nav"]',
      route: "/coach/schedule",
      title: "Weekly Calendar Navigation",
      description:
        "Jump between previous, current, and upcoming weeks using the Monday-start week controls to inspect schedules and prep workout plans.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-calendar-day-selector"]',
      route: "/coach/schedule",
      title: "Day-by-Day Selector",
      description:
        "Switch between individual days of the week on mobile or desktop to focus on a specific day's workout schedule.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="coach-calendar-week-nav"]',
    },
    {
      targetSelector: '[data-walkthrough="coach-calendar-session-card"]',
      route: "/coach/schedule",
      title: "Class Sessions & Capacity",
      description:
        "Session cards display category, start/end times, room location, and enrolled capacity (e.g. 10/12 booked).",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-session-clients-btn"]',
      route: "/coach/schedule",
      title: "Enrolled Attendee Roster",
      description:
        "Click on any session to open the full attendee modal with member names, phone numbers, and package types.",
      placement: "left",
      fallbackSelector: '[data-walkthrough="coach-calendar-session-card"]',
    },
  ],

  "coach-scans-radar": [
    {
      targetSelector: '[data-walkthrough="coach-scans-header"]',
      route: "/coach/scans",
      title: "Radar Controls & Live Socket",
      description:
        "The live radar stays synced via WebSocket. New turnstile check-ins and attendance confirmations refresh automatically.",
      placement: "bottom",
      fallbackSelector: "header",
    },
    {
      targetSelector: '[data-walkthrough="coach-scans-pt"]',
      route: "/coach/scans",
      title: "Personal Training Check-ins",
      description:
        "If you conduct Personal Training sessions, trainees checking in for your PT packages appear in this dedicated section.",
      placement: "bottom",
      fallbackSelector: "main",
      requiresPt: true,
    },
    {
      targetSelector: '[data-walkthrough="coach-class-scan-card"]',
      route: "/coach/scans",
      title: "Class Check-in Logs",
      description:
        "Inspect member names, check-in timestamps, phone numbers, and turnstile pass/fail statuses for every session today.",
      placement: "top",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-scans-row"]',
      route: "/coach/scans",
      title: "Member Quick Peek",
      description:
        "Click any member check-in row to view contact details, initiate a direct phone call, or jump to their client profile.",
      placement: "top",
      fallbackSelector: '[data-walkthrough="coach-class-scan-card"]',
    },
  ],

  "coach-pt-client-management": [
    {
      targetSelector: '[data-walkthrough="coach-clients-search"]',
      route: "/coach/clients",
      title: "Client Roster Search",
      description:
        "Search your assigned personal training clients by name or phone number with real-time debounced filtering.",
      placement: "bottom",
      fallbackSelector: "main",
      requiresPt: true,
    },
    {
      targetSelector: '[data-walkthrough="coach-clients-filters"]',
      route: "/coach/clients",
      title: "Status & Expiry Filter Chips",
      description:
        "Filter between Active or Past trainees, or quickly isolate clients whose packages have <= 2 sessions left or expire within 14 days.",
      placement: "bottom",
      fallbackSelector: '[data-walkthrough="coach-clients-search"]',
      requiresPt: true,
    },
    {
      targetSelector: '[data-walkthrough="coach-clients-card"]',
      route: "/coach/clients",
      title: "Client Profile & Package Overview",
      description:
        "Click on any client to view their package validity, remaining classes progress bar, and contact options.",
      placement: "top",
      fallbackSelector: "main",
      requiresPt: true,
    },
    {
      targetSelector: '[data-walkthrough="coach-package-deduct-btn"]',
      route: "/coach/clients",
      title: "Deduct Completed PT Session",
      description:
        "Click Deduct to register a completed workout session, select session date, and enter a mandatory audit reason.",
      placement: "left",
      fallbackSelector: '[data-walkthrough="coach-clients-card"]',
      requiresPt: true,
    },
  ],

  "coach-tickets-support": [
    {
      targetSelector: '[data-walkthrough="coach-tickets-tabs"]',
      route: "/coach/tickets",
      title: "Ticket Status Tabs",
      description:
        "Filter your submitted requests across Pending, In Progress, Resolved, or Rejected statuses.",
      placement: "bottom",
      fallbackSelector: "main",
    },
    {
      targetSelector: '[data-walkthrough="coach-tickets-create-btn"]',
      route: "/coach/tickets",
      title: "Submit Maintenance or Help Ticket",
      description:
        "Click '+ New Ticket' to report equipment issues (e.g. broken cables, studio temperature), scheduling conflicts, or member requests.",
      placement: "bottom",
      fallbackSelector: "header",
    },
    {
      targetSelector: '[data-walkthrough="coach-tickets-table"]',
      route: "/coach/tickets",
      title: "Ticket Resolution Tracking",
      description:
        "Inspect management responses, priority levels, and resolution timestamps in real time.",
      placement: "top",
      fallbackSelector: "main",
    },
  ],

  "coach-mailing-broadcasts": [
    {
      targetSelector: '[data-walkthrough="coach-nav-mailing"]',
      route: "/coach/today",
      title: "Managing Coach Mail Center",
      description:
        "Managing Coaches have access to the gym email center in the sidebar to send announcements and communicate with branch members.",
      placement: "right",
      fallbackSelector: "aside",
    },
    {
      targetSelector: '[data-walkthrough="coach-help-btn"]',
      route: "/coach/today",
      title: "Interactive Guides Anytime",
      description:
        "Click the Guides button in the header at any time to browse tutorials or replay any step-by-step walkthrough.",
      placement: "bottom",
      fallbackSelector: "header",
    },
  ],
};

