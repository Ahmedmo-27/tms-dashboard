"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  sendNotification,
  getNotificationHistory,
  getNotificationStats,
} from "@/lib/data/notifications";
import type {
  NotificationLog,
  NotificationStats,
  NotificationTargetType,
  TargetUserItem,
} from "@/types/notifications";
import { useLocations } from "@/lib/hooks/use-locations";
import { PhonePreview } from "./phone-preview";
import { UserSearchSelector } from "./user-search-selector";
import { ConfirmSendDialog } from "./confirm-send-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Send,
  Users,
  Radio,
  Building2,
  Dumbbell,
  Smartphone,
  History,
  Sparkles,
  RefreshCw,
  Search,
  Clock,
  RotateCcw,
  Eye,
  Layers,
  ChevronDown,
  Info,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const DEFAULT_TITLE = "THE MIND SPACE.";

const PRESET_TEMPLATES = [
  {
    label: "Holiday Schedule",
    title: "THE MIND SPACE.",
    body: "Please note our upcoming holiday schedule changes. Check the class schedule tab for updated session timings!",
  },
  {
    label: "New Classes Added",
    title: "THE MIND SPACE.",
    body: "Exciting new classes and workshops have just been added to the schedule. Book your spot today!",
  },
  {
    label: "Special Promotion",
    title: "THE MIND SPACE.",
    body: "Exclusive package upgrade available this week! Check our packages catalog for limited-time offers.",
  },
  {
    label: "App Maintenance",
    title: "THE MIND SPACE.",
    body: "Scheduled maintenance will occur tonight at 2:00 AM. Services will resume shortly after.",
  },
  {
    label: "Booking Reminder",
    title: "THE MIND SPACE.",
    body: "Don't forget to book your weekly sessions early to guarantee your preferred coach and time slot!",
  },
];

const AUDIENCE_OPTIONS: Array<{
  id: NotificationTargetType;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "custom",
    label: "Specific Members",
    badge: "Direct",
    icon: Users,
  },
  {
    id: "all",
    label: "Broadcast All",
    badge: "All Users",
    icon: Radio,
  },
  {
    id: "members",
    label: "Active Members",
    badge: "Members",
    icon: Dumbbell,
  },
  {
    id: "branch",
    label: "Branch Members",
    badge: "Location",
    icon: Building2,
  },
  {
    id: "coaches",
    label: "Coaches & Staff",
    badge: "Team",
    icon: Layers,
  },
];

export function NotificationsContainer() {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Form state
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<NotificationTargetType>("custom");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<TargetUserItem[]>([]);

  // Dialog and loading states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState<NotificationLog | null>(null);

  // Stats & History state
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [historyItems, setHistoryItems] = useState<NotificationLog[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState("");
  const [historyTargetType, setHistoryTargetType] = useState("all");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Locations
  const { locations } = useLocations();

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await getNotificationStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load notification stats:", err);
    }
  }, []);

  // Load history
  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await getNotificationHistory({
        page: historyPage,
        limit: 15,
        search: historySearch,
        targetType: historyTargetType !== "all" ? historyTargetType : undefined,
      });
      setHistoryItems(res.items);
      setHistoryTotal(res.total);
    } catch (err) {
      console.error("Failed to load notification history:", err);
      toast.error("Failed to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historyPage, historySearch, historyTargetType]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleSelectUser = (user: TargetUserItem) => {
    if (!selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleClearAllUsers = () => {
    setSelectedUsers([]);
  };

  const handleApplyTemplate = (tpl: (typeof PRESET_TEMPLATES)[number]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    toast.success(`Applied template: ${tpl.label}`);
  };

  const handleUseLogAsTemplate = (log: NotificationLog) => {
    setTitle(log.title || DEFAULT_TITLE);
    setBody(log.body);
    if (log.targetType) {
      setTargetType(log.targetType);
    }
    setActiveTab("compose");
    toast.success("Loaded notification into composer");
  };

  const handleValidateAndOpenConfirm = () => {
    if (!body.trim()) {
      toast.error("Please enter a notification message body");
      return;
    }

    if (targetType === "custom" && selectedUsers.length === 0) {
      toast.error("Please select at least one recipient user");
      return;
    }

    if (targetType === "branch" && !selectedLocationId) {
      toast.error("Please select a target branch");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleDispatch = async () => {
    setIsSending(true);
    try {
      const payload = {
        title: title.trim() || DEFAULT_TITLE,
        body: body.trim(),
        targetType,
        locationId: targetType === "branch" ? selectedLocationId : undefined,
        userIds: targetType === "custom" ? selectedUsers.map((u) => u._id) : undefined,
      };

      const result = await sendNotification(payload);
      toast.success(
        `Notifications dispatched successfully to ${result.matchedUsers} user(s)`
      );

      // Reset form
      setBody("");
      setTitle(DEFAULT_TITLE);
      setSelectedUsers([]);
      setIsConfirmOpen(false);

      // Refresh stats and history
      fetchStats();
      if (activeTab === "history") {
        fetchHistory();
      }
    } catch (err: unknown) {
      console.error("Failed to send notification:", err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(apiErr.response?.data?.message || apiErr.message || "Failed to dispatch notification");
    } finally {
      setIsSending(false);
    }
  };

  const selectedBranchName = locations.find((l) => l._id === selectedLocationId)?.branchName;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Notifications Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Dispatch push &amp; in-app notifications directly to TMS mobile application members
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "compose" | "history")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-2 h-9 p-1">
              <TabsTrigger value="compose" className="text-xs px-3 gap-1.5 cursor-pointer font-medium">
                <Send className="h-3.5 w-3.5" />
                Compose &amp; Send
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs px-3 gap-1.5 cursor-pointer font-medium">
                <History className="h-3.5 w-3.5" />
                Sent History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 2. Compact Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground truncate">
              Reachable App Devices
            </div>
            <div className="text-lg font-bold tracking-tight">
              {stats?.reachableUsersCount ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Send className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground truncate">
              Total Broadcasts
            </div>
            <div className="text-lg font-bold tracking-tight">
              {stats?.totalSent ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground truncate">
              Sent This Month
            </div>
            <div className="text-lg font-bold tracking-tight">
              {stats?.sentThisMonth ?? "—"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground truncate">
              Recipients Reached
            </div>
            <div className="text-lg font-bold tracking-tight">
              {stats?.totalRecipientsReached ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Studio Area */}
      {activeTab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Studio Composer */}
          <div className="lg:col-span-7">
            <Card className="shadow-xs rounded-xl overflow-hidden border">
              <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Notification Studio
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Configure recipient audience and compose your mobile message
                    </CardDescription>
                  </div>

                  {/* Preset Templates Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 shrink-0 font-medium cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Presets</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Insert Preset Template
                      </div>
                      {PRESET_TEMPLATES.map((tpl) => (
                        <DropdownMenuItem
                          key={tpl.label}
                          onClick={() => handleApplyTemplate(tpl)}
                          className="text-xs cursor-pointer"
                        >
                          <span className="font-medium">{tpl.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-5">
                {/* 1. Target Audience Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> 1. Target Audience
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Select delivery target
                    </span>
                  </div>

                  {/* Segmented Audience Buttons Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-muted/40 p-1 rounded-xl border">
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = targetType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTargetType(opt.id)}
                          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-background text-foreground shadow-xs font-semibold ring-1 ring-border"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                          }`}
                        >
                          <Icon className={`h-4 w-4 mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-[11px] leading-tight truncate w-full">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Specific Users Selector Subview */}
                  {targetType === "custom" && (
                    <div className="pt-2 animate-in fade-in-50 duration-200">
                      <UserSearchSelector
                        selectedUsers={selectedUsers}
                        onSelectUser={handleSelectUser}
                        onRemoveUser={handleRemoveUser}
                        onClearAll={handleClearAllUsers}
                      />
                    </div>
                  )}

                  {/* Branch Selector Subview */}
                  {targetType === "branch" && (
                    <div className="pt-2 animate-in fade-in-50 duration-200 space-y-1.5">
                      <Label className="text-xs font-medium">Select Branch Location:</Label>
                      <Select
                        value={selectedLocationId}
                        onValueChange={(val) => setSelectedLocationId(val)}
                      >
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue placeholder="Choose branch location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc._id} value={loc._id} className="text-xs">
                              {loc.branchName} ({loc.location})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Info Notice for Broadcast / Members */}
                  {(targetType === "all" || targetType === "members") && (
                    <div className="rounded-lg border bg-primary/5 border-primary/20 p-2.5 flex items-center gap-2 text-xs text-foreground animate-in fade-in-50 duration-200">
                      <Info className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        {targetType === "all"
                          ? "This notification will be broadcast to all app users with active device tokens."
                          : "This notification will be sent to all active club & gym members."}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-4">
                  {/* Notification Title (Default: THE MIND SPACE) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        2. Notification Title
                      </Label>
                      <div className="flex items-center gap-2">
                        {title !== DEFAULT_TITLE && (
                          <button
                            type="button"
                            onClick={() => setTitle(DEFAULT_TITLE)}
                            className="text-[11px] text-primary hover:underline cursor-pointer"
                          >
                            Reset to default
                          </button>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {title.length}/80
                        </span>
                      </div>
                    </div>
                    <Input
                      id="title-input"
                      value={title}
                      maxLength={80}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="THE MIND SPACE."
                      className="font-medium text-sm"
                    />
                  </div>

                  {/* Message Body */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="body-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        3. Message Body <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {body.length}/500
                      </span>
                    </div>
                    <Textarea
                      id="body-input"
                      value={body}
                      maxLength={500}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                      placeholder="Write your push notification message here..."
                      className="text-sm leading-relaxed"
                    />
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>
                      Target: <strong className="text-foreground">{targetType.toUpperCase()}</strong>
                      {targetType === "custom" && ` (${selectedUsers.length} selected)`}
                      {targetType === "branch" && selectedBranchName && ` (${selectedBranchName})`}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="default"
                    onClick={handleValidateAndOpenConfirm}
                    className="gap-2 font-medium cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Review &amp; Dispatch Push Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border shadow-xs rounded-xl p-4 bg-card/60">
              <PhonePreview
                title={title}
                body={body}
              />

              {/* Channel Indicators */}
              <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-center text-[11px] text-muted-foreground">
                <div className="rounded-lg border p-1.5 bg-muted/20">
                  <span className="font-semibold text-foreground block">FCM Push</span>
                  <span>Active &amp; Ready</span>
                </div>
                <div className="rounded-lg border p-1.5 bg-muted/20">
                  <span className="font-semibold text-foreground block">In-App Sync</span>
                  <span>Cloud Firestore</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* SENT HISTORY TAB */
        <Card className="shadow-xs rounded-xl overflow-hidden border">
          <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Sent Notifications Audit Log
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Browse previous push notification campaigns and delivery reports
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchHistory}
                disabled={isHistoryLoading}
                className="gap-1.5 self-start sm:self-auto text-xs h-8 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isHistoryLoading ? "animate-spin" : ""}`} />
                Refresh Logs
              </Button>
            </div>

            {/* Horizontal Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by title, body, or sender..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <Select
                value={historyTargetType}
                onValueChange={(val) => {
                  setHistoryTargetType(val);
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="All Target Audiences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Audiences</SelectItem>
                  <SelectItem value="custom" className="text-xs">Specific Members</SelectItem>
                  <SelectItem value="members" className="text-xs">Active Members</SelectItem>
                  <SelectItem value="branch" className="text-xs">Branch Members</SelectItem>
                  <SelectItem value="coaches" className="text-xs">Coaches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Notification</TableHead>
                    <TableHead className="text-xs font-semibold">Audience</TableHead>
                    <TableHead className="text-xs font-semibold">Recipients</TableHead>
                    <TableHead className="text-xs font-semibold">Sent By</TableHead>
                    <TableHead className="text-xs font-semibold">Sent Date</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                        Loading notification history...
                      </TableCell>
                    </TableRow>
                  ) : historyItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                        No notifications found in audit logs.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyItems.map((log) => (
                      <TableRow key={log._id} className="hover:bg-muted/30">
                        <TableCell className="max-w-[240px]">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {log.title || DEFAULT_TITLE}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {log.body}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="capitalize text-xs font-medium">
                            {log.targetType}
                            {log.locationId && ` (${log.locationId.branchName})`}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs font-semibold font-mono">
                          {log.recipientCount}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {log.sentByName || log.sentBy?.name || "Management"}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={log.status === "sent" ? "default" : "destructive"}
                            className="text-[9.5px] px-1.5 py-0 font-medium"
                          >
                            {log.status === "sent" ? "Delivered" : log.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLogDetails(log)}
                              className="h-7 w-7 p-0 cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUseLogAsTemplate(log)}
                              className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary cursor-pointer font-medium"
                              title="Load into composer"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Re-send
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {historyTotal > 15 && (
              <div className="p-3 border-t">
                <TablePagination
                  pageIndex={historyPage - 1}
                  pageCount={Math.ceil(historyTotal / 15)}
                  total={historyTotal}
                  pageSize={15}
                  onPageChange={(zeroBasedIndex) => setHistoryPage(zeroBasedIndex + 1)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Send Dialog */}
      <ConfirmSendDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={title}
        body={body}
        targetType={targetType}
        recipientCount={targetType === "custom" ? selectedUsers.length : 0}
        branchName={selectedBranchName}
        isSending={isSending}
        onConfirm={handleDispatch}
      />

      {/* View Details Dialog */}
      {selectedLogDetails && (
        <Dialog
          open={Boolean(selectedLogDetails)}
          onOpenChange={(open) => !open && setSelectedLogDetails(null)}
        >
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-4 w-4 text-primary" />
                Notification Audit Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Dispatched on{" "}
                {format(new Date(selectedLogDetails.createdAt), "MMMM d, yyyy 'at' HH:mm")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border p-2 bg-muted/20">
                  <span className="text-muted-foreground block mb-0.5 text-[11px]">Title:</span>
                  <span className="font-semibold text-foreground">
                    {selectedLogDetails.title || DEFAULT_TITLE}
                  </span>
                </div>
                <div className="rounded-lg border p-2 bg-muted/20">
                  <span className="text-muted-foreground block mb-0.5 text-[11px]">Audience Target:</span>
                  <span className="font-semibold text-foreground capitalize">
                    {selectedLogDetails.targetType}
                  </span>
                </div>
                <div className="rounded-lg border p-2 bg-muted/20">
                  <span className="text-muted-foreground block mb-0.5 text-[11px]">Recipients Reached:</span>
                  <span className="font-semibold text-foreground">
                    {selectedLogDetails.recipientCount} users
                  </span>
                </div>
                <div className="rounded-lg border p-2 bg-muted/20">
                  <span className="text-muted-foreground block mb-0.5 text-[11px]">Sent By:</span>
                  <span className="font-semibold text-foreground">
                    {selectedLogDetails.sentByName || selectedLogDetails.sentBy?.name || "Management"}
                  </span>
                </div>
                <div className="rounded-lg border p-2 bg-muted/20 col-span-2">
                  <span className="text-muted-foreground block mb-0.5 text-[11px]">Delivery Status:</span>
                  <Badge variant="default" className="text-[10px]">
                    {selectedLogDetails.status}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border p-3 bg-muted/15 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Notification Message:
                </span>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedLogDetails.body}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedLogDetails(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  handleUseLogAsTemplate(selectedLogDetails);
                  setSelectedLogDetails(null);
                }}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Load into Composer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
