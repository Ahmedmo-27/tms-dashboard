"use client";

import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { tms } from "@/lib/tms-api";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  MailOpen, 
  Send, 
  Users, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  RefreshCw,
  Radio,
  AtSign,
  GraduationCap
} from "lucide-react";
import { toast } from "react-hot-toast";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { cn } from "@/lib/utils";

export type MailLog = {
  _id: string;
  mode: string;
  subject: string;
  body: string;
  recipients: number | string[];
  sent_at: string;
  status: string;
  error_msg?: string;
  sender_email?: string;
  sender_name?: string;
};

const MODE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  broadcast: {
    label: "Broadcast All",
    icon: Radio,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  members: {
    label: "Members",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  coaches: {
    label: "Coaches",
    icon: GraduationCap,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  manual: {
    label: "Direct / Manual",
    icon: AtSign,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

function formatSentDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";

  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

export function MailingSent() {
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMail, setSelectedMail] = useState<MailLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const fetchLogs = async (silent = false, customPage = page) => {
    if (!silent) setIsLoading(true);
    try {
      const params: any = {
        page: customPage,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (audienceFilter !== "all") params.mode = audienceFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await tms.get("/admin/mail/logs", { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        setLogs(data);
        setTotalCount(data.length);
      } else if (data && typeof data === "object") {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setTotalCount(typeof data.total === "number" ? data.total : (data.logs?.length || 0));
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
      if (!silent) setLogs([]);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs(false, 1);
    const interval = setInterval(() => {
      fetchLogs(true, page);
    }, 15000);
    return () => clearInterval(interval);
  }, [page]);

  useEffect(() => {
    setPage(1);
    fetchLogs(false, 1);
  }, [search, audienceFilter, statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs(false, page);
  };

  const handleCopyBody = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBody(true);
    toast.success("Message content copied!");
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const safeLogs = Array.isArray(logs) ? logs : [];

  // Metrics
  const sentCount = safeLogs.filter((l) => l.status === "sent").length;
  const failedCount = safeLogs.filter((l) => l.status === "failed").length;
  const broadcastCount = safeLogs.filter((l) => l.mode === "broadcast").length;

  const filteredLogs = safeLogs.filter((log) => {
    const matchesSearch =
      (log.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.mode || "").toLowerCase().includes(search.toLowerCase());

    const matchesAudience = audienceFilter === "all" || log.mode === audienceFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesAudience && matchesStatus;
  });

  const pageCount = Math.ceil(totalCount / pageSize) || 1;

  const handlePageChange = (pageIndex: number) => {
    const newPage = pageIndex + 1;
    setPage(newPage);
    fetchLogs(false, newPage);
  };

  const getRecipientCount = (recipients: number | string[]) => {
    if (typeof recipients === "number") return recipients;
    if (Array.isArray(recipients)) return recipients.length;
    return 1;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Top Summary Stat Cards */}
        <div data-walkthrough="sent-metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 border shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Total Messages</span>
              <Send className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">All time dispatches</p>
          </Card>

          <Card className="p-4 border shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Successful Deliveries</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{sentCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Dispatched to recipients</p>
          </Card>

          <Card className="p-4 border shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Delivery Issues</span>
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold text-foreground">{failedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Failed attempts</p>
          </Card>

          <Card className="p-4 border shadow-2xs rounded-xl bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Broadcasts</span>
              <Radio className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{broadcastCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mass communications</p>
          </Card>
        </div>

        {/* Sent History Table Card */}
        <Card data-walkthrough="sent-logs-list" className="border shadow-xs rounded-xl overflow-hidden bg-card flex flex-col min-h-[500px]">
          <CardHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/15 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Sent Dispatches
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Track delivery records, recipient counts, and dispatch diagnostics.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="gap-2 text-xs font-medium h-9 self-start sm:self-auto"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh History"}</span>
              </Button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search subject or mode..."
                  className="pl-9 pr-8 h-9 text-xs bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Audience Tabs */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border text-xs">
                  {["all", "manual", "broadcast", "members", "coaches"].map((aud) => (
                    <button
                      key={aud}
                      onClick={() => setAudienceFilter(aud)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md transition-all capitalize cursor-pointer",
                        audienceFilter === aud
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {aud === "all" ? "All Targets" : aud}
                    </button>
                  ))}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border text-xs">
                  {["all", "sent", "failed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md transition-all capitalize cursor-pointer",
                        statusFilter === st
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Table */}
          <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="h-full w-full flex-1">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[110px] pl-4 sm:pl-6 text-xs font-semibold">Status</TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold">Audience</TableHead>
                    <TableHead className="text-xs font-semibold">Subject</TableHead>
                    <TableHead className="w-[110px] text-center text-xs font-semibold">Recipients</TableHead>
                    <TableHead className="w-[140px] sm:w-[160px] text-right pr-4 sm:pr-6 text-xs font-semibold">Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="h-16 text-center text-muted-foreground animate-pulse text-xs">
                          Loading dispatch history...
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto py-8">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <MailOpen className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground text-sm">No sent messages found</h3>
                            <p className="text-xs text-muted-foreground">
                              {search || audienceFilter !== "all" || statusFilter !== "all"
                                ? "No logs match the current search or filters. Try clearing filters."
                                : "You haven't dispatched any emails yet. Messages sent via Compose will appear here."}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const modeInfo = MODE_CONFIG[log.mode] || {
                        label: log.mode,
                        icon: Users,
                        color: "bg-muted text-foreground border-border",
                      };
                      const ModeIcon = modeInfo.icon;
                      const count = getRecipientCount(log.recipients);

                      return (
                        <TableRow
                          key={log._id}
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => setSelectedMail(log)}
                        >
                          {/* Status Badge */}
                          <TableCell className="pl-4 sm:pl-6 py-3.5">
                            {log.status === "sent" ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20 gap-1 text-[11px] font-medium"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Sent
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="gap-1 text-[11px] font-medium"
                              >
                                <XCircle className="h-3 w-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>

                          {/* Audience Badge */}
                          <TableCell className="py-3.5">
                            <Badge
                              variant="outline"
                              className={cn("gap-1 text-[11px] font-normal capitalize", modeInfo.color)}
                            >
                              <ModeIcon className="h-3 w-3" />
                              {modeInfo.label}
                            </Badge>
                          </TableCell>

                          {/* Subject */}
                          <TableCell className="py-3.5 max-w-[320px]">
                            <span className="font-medium text-xs sm:text-sm text-foreground truncate block">
                              {log.subject || "(No Subject)"}
                            </span>
                          </TableCell>

                          {/* Recipients Count */}
                          <TableCell className="text-center py-3.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-medium bg-muted/50 px-2 py-0.5 rounded-md text-[11px]">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {count}
                            </span>
                          </TableCell>

                          {/* Sent Date */}
                          <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap pr-4 sm:pr-6 py-3.5">
                            {formatSentDate(log.sent_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Pagination Footer */}
            {totalCount > pageSize && (
              <div className="p-4 border-t bg-muted/10">
                <TablePagination
                  pageIndex={page - 1}
                  pageCount={pageCount}
                  total={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Preview Dialog */}
      <Dialog open={!!selectedMail} onOpenChange={(open) => !open && setSelectedMail(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl h-[88vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-xl">
          {selectedMail && (
            <>
              {/* Dialog Header */}
              <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b bg-muted/20 space-y-2 sm:space-y-3 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0 pr-6 sm:pr-0">
                    <DialogTitle className="text-base sm:text-xl font-bold leading-snug break-words">
                      {selectedMail.subject}
                    </DialogTitle>
                    {selectedMail.sender_email && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                        <strong>Dispatched by:</strong>{" "}
                        {selectedMail.sender_name
                          ? `${selectedMail.sender_name} <${selectedMail.sender_email}>`
                          : selectedMail.sender_email}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={selectedMail.status === "sent" ? "outline" : "destructive"}
                    className={cn(
                      "text-xs capitalize font-medium shrink-0",
                      selectedMail.status === "sent" &&
                        "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                    )}
                  >
                    {selectedMail.status}
                  </Badge>
                </div>

                {/* Dispatch Details Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 text-xs">
                  <div className="bg-background border rounded-lg p-1.5 sm:p-2 min-w-0">
                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Audience</span>
                    <span className="font-semibold capitalize text-foreground truncate block text-xs sm:text-sm">{selectedMail.mode}</span>
                  </div>
                  <div className="bg-background border rounded-lg p-1.5 sm:p-2 min-w-0">
                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Recipients</span>
                    <span className="font-semibold text-foreground truncate block text-xs sm:text-sm">
                      {getRecipientCount(selectedMail.recipients)} recipient{getRecipientCount(selectedMail.recipients) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="bg-background border rounded-lg p-1.5 sm:p-2 col-span-2 sm:col-span-1 min-w-0">
                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Sent Date</span>
                    <span className="font-semibold text-foreground truncate block text-xs sm:text-sm">
                      {selectedMail.sent_at ? format(new Date(selectedMail.sent_at), "PPP p") : "-"}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              {/* Error Callout if Failed */}
              {selectedMail.error_msg && (
                <div className="p-3 bg-destructive/10 border-b text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <div className="break-words">
                    <strong>Delivery Error:</strong> {selectedMail.error_msg}
                  </div>
                </div>
              )}

              {/* Body Content */}
              <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto bg-background">
                <div
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto break-words [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:h-auto [&_pre]:overflow-x-auto [&_pre]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedMail.body) }}
                />
              </ScrollArea>

              {/* Dialog Footer */}
              <DialogFooter className="p-3 sm:p-4 bg-muted/20 border-t flex flex-row items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyBody(selectedMail.body)}
                  className="gap-1.5 text-xs h-8 px-3"
                >
                  {copiedBody ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedBody ? "Copied" : "Copy Content"}</span>
                </Button>

                <Button variant="outline" size="sm" onClick={() => setSelectedMail(null)} className="text-xs h-8 px-3">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

