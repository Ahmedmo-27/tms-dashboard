"use client";

import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { tms } from "@/lib/tms-api";
import { 
  Search, 
  Inbox, 
  Reply, 
  Mail, 
  MailOpen,
  CheckCheck,
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  ExternalLink,
  Clock,
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAppDispatch } from "@/lib/hooks";
import { 
  markMailNotificationRead, 
  markMailNotificationUnread, 
  markAllMailNotificationsRead 
} from "@/lib/store/features/mailSlice";
import { createTmsSocket } from "@/lib/socket";
import { getToken } from "@/lib/cookie";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
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
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { cn } from "@/lib/utils";

export type ReceivedEmail = {
  _id: string;
  from: string;
  to?: string;
  recipientEmail?: string;
  subject: string;
  text: string;
  html: string;
  date: string;
  isRead: boolean;
};

interface MailingInboxProps {
  composeUrl?: string;
}

const AVATAR_COLORS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function parseSender(from: string) {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].replace(/["']/g, "").trim();
    return { name: name || match[2], email: match[2] };
  }
  return { name: from, email: from };
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatEmailDate(dateStr: string) {
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

export function MailingInbox({ composeUrl = "/dashboard/mailing" }: MailingInboxProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [mailboxEmail, setMailboxEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await tms.get("/admin/mail/unread-count");
      const count = res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
      setUnreadTotal(count);
    } catch (err) {
      console.debug("Failed to fetch unread count:", err);
    }
  };

  const fetchEmails = async (silent = false, customPage = page) => {
    if (!silent) setIsLoading(true);
    try {
      const params: any = {
        page: customPage,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (filterTab === "unread") params.status = "unread";

      const response = await tms.get("/admin/mail/inbox", { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        setEmails(data);
        setTotalCount(data.length);
      } else if (data && typeof data === "object") {
        setEmails(Array.isArray(data.emails) ? data.emails : []);
        setTotalCount(typeof data.total === "number" ? data.total : (data.emails?.length || 0));
      }
    } catch (error) {
      console.error("Failed to fetch inbox", error);
      if (!silent) setEmails([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(false, 1);
    fetchUnreadCount();
    tms.get("/admin/mail/profile")
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.email) setMailboxEmail(data.email);
      })
      .catch(() => {});

    // Silent live refresh every 15 seconds
    const pollInterval = setInterval(() => {
      fetchEmails(true, page);
      fetchUnreadCount();
    }, 15000);

    // Background IMAP sync check every 40 seconds
    const syncInterval = setInterval(() => {
      tms.post("/admin/mail/sync", { page, limit: pageSize })
        .then((res) => {
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) {
            setEmails(data);
            setTotalCount(data.length);
          } else if (data && typeof data === "object" && Array.isArray(data.emails)) {
            setEmails(data.emails);
            setTotalCount(typeof data.total === "number" ? data.total : data.emails.length);
          }
          fetchUnreadCount();
        })
        .catch(() => {});
    }, 40000);

    // Socket live listener to prepend incoming emails immediately
    let socket: any = null;
    getToken().then((token) => {
      socket = createTmsSocket(token);
      socket.on("connect", () => {
        socket.emit("mail:joinRoom", { token });
      });
      socket.on("mail:newEmail", (payload: any) => {
        const emailId = payload.id || payload._id;
        if (!emailId) return;

        if (mailboxEmail) {
          const myMail = mailboxEmail.toLowerCase();
          const toStr = (payload.to || "").toLowerCase();
          const recStr = (payload.recipientEmail || "").toLowerCase();
          if (recStr !== myMail && !toStr.includes(myMail)) {
            return;
          }
        }

        setUnreadTotal((prev) => prev + 1);
        fetchEmails(true, 1);
      });
    });

    return () => {
      clearInterval(pollInterval);
      clearInterval(syncInterval);
      if (socket) socket.disconnect();
    };
  }, [page, mailboxEmail]);

  useEffect(() => {
    setPage(1);
    fetchEmails(false, 1);
  }, [search, filterTab]);

  const handleSelectEmail = async (email: ReceivedEmail) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails((prev) =>
        prev.map((e) => (e._id === email._id ? { ...e, isRead: true } : e))
      );
      dispatch(markMailNotificationRead(email._id));
      setUnreadTotal((prev) => Math.max(0, prev - 1));

      try {
        await tms.patch(`/admin/mail/${email._id}/read`);
      } catch (err) {
        console.debug("Failed to mark email read in database:", err);
      }
    }
  };

  const handleToggleRead = async (email: ReceivedEmail, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newReadState = !email.isRead;

    setEmails((prev) =>
      prev.map((item) => (item._id === email._id ? { ...item, isRead: newReadState } : item))
    );
    if (selectedEmail && selectedEmail._id === email._id) {
      setSelectedEmail({ ...selectedEmail, isRead: newReadState });
    }

    if (newReadState) {
      dispatch(markMailNotificationRead(email._id));
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } else {
      dispatch(markMailNotificationUnread(email._id));
      setUnreadTotal((prev) => prev + 1);
    }

    try {
      await tms.patch(`/admin/mail/${email._id}/read`, { isRead: newReadState });
      toast.success(newReadState ? "Marked as read" : "Marked as unread");
    } catch (err) {
      console.debug("Failed to update email read status:", err);
      toast.error("Failed to update read status");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadTotal === 0 && unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await tms.patch("/admin/mail/read-all");
      setEmails((prev) => prev.map((e) => ({ ...e, isRead: true })));
      if (selectedEmail) {
        setSelectedEmail({ ...selectedEmail, isRead: true });
      }
      setUnreadTotal(0);
      dispatch(markAllMailNotificationsRead());
      toast.success("All emails marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all emails as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await tms.post("/admin/mail/sync", { page, limit: pageSize });
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        setEmails(data);
        setTotalCount(data.length);
      } else if (data && typeof data === "object") {
        setEmails(Array.isArray(data.emails) ? data.emails : []);
        setTotalCount(typeof data.total === "number" ? data.total : (data.emails?.length || 0));
      }
      fetchUnreadCount();
      toast.success("Inbox refreshed from mail server!");
    } catch (error) {
      console.error("Failed to sync inbox", error);
      toast.error("Failed to sync inbox");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyBody = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBody(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const filteredEmails = (Array.isArray(emails) ? emails : []).filter((email) => {
    const matchesSearch =
      (email.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (email.from || "").toLowerCase().includes(search.toLowerCase()) ||
      (email.text || "").toLowerCase().includes(search.toLowerCase());

    if (filterTab === "unread") {
      return matchesSearch && !email.isRead;
    }
    return matchesSearch;
  });

  const unreadCount = (Array.isArray(emails) ? emails : []).filter((e) => !e.isRead).length;
  const pageCount = Math.ceil(totalCount / pageSize) || 1;

  const handlePageChange = (pageIndex: number) => {
    const newPage = pageIndex + 1;
    setPage(newPage);
    fetchEmails(false, newPage);
  };

  const handleReply = (email: ReceivedEmail) => {
    const { email: replyEmail } = parseSender(email.from);
    router.push(
      `${composeUrl}?replyTo=${encodeURIComponent(replyEmail)}&subject=${encodeURIComponent(email.subject || "")}`
    );
  };

  return (
    <>
      <Card className="border shadow-xs rounded-xl overflow-hidden bg-card flex flex-col min-h-[600px]">
        {/* Top Header */}
        <CardHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/15 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-primary" />
                  Inbox
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-normal">
                  {totalCount} total
                </Badge>
                {unreadTotal > 0 && (
                  <Badge className="text-xs bg-primary text-primary-foreground font-semibold">
                    {unreadTotal} unread
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {mailboxEmail ? (
                  <>
                    Connected mailbox: <span className="font-semibold text-foreground">{mailboxEmail}</span>
                  </>
                ) : (
                  "Incoming messages received at your mailbox address."
                )}
              </CardDescription>
            </div>

            {/* Sync & Refresh Button */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll || isLoading}
                  className="gap-1.5 text-xs font-medium h-9 text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className={cn("h-3.5 w-3.5", isMarkingAll && "animate-spin text-primary")} />
                  <span>{isMarkingAll ? "Marking..." : "Mark All Read"}</span>
                </Button>
              )}
              <Button
                data-walkthrough="inbox-sync-btn"
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing || isLoading}
                className="gap-2 text-xs font-medium h-9"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin text-primary")} />
                <span>{isSyncing ? "Syncing..." : "Sync Mailbox"}</span>
              </Button>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div data-walkthrough="inbox-search" className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search sender, subject, or keywords..."
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
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-lg border">
              <button
                onClick={() => setFilterTab("all")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                  filterTab === "all"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Messages ({filterTab === "all" ? totalCount : emails.length})
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                  filterTab === "unread"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread ({unreadTotal})
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Mail List Area */}
        <CardContent data-walkthrough="inbox-email-list" className="p-0 flex-1 flex flex-col">
          <ScrollArea className="h-full w-full flex-1">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[240px] sm:w-[280px] pl-4 sm:pl-6 text-xs font-semibold">Sender</TableHead>
                  <TableHead className="text-xs font-semibold">Subject & Message Snippet</TableHead>
                  <TableHead className="w-[140px] sm:w-[160px] text-right pr-4 sm:pr-6 text-xs font-semibold">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3} className="h-16 text-center text-muted-foreground animate-pulse text-xs">
                        Fetching messages from mail server...
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredEmails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto py-8">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Inbox className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground text-sm">No messages found</h3>
                          <p className="text-xs text-muted-foreground">
                            {search
                              ? `No messages matched "${search}". Try adjusting your search query.`
                              : "Your mailbox is completely up to date. Incoming emails will display here."}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSync} className="text-xs gap-1.5 mt-2">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Check For New Mail
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmails.map((email) => {
                    const { name, email: senderEmail } = parseSender(email.from);
                    const isUnread = !email.isRead;

                    return (
                      <TableRow
                        key={email._id}
                        className={cn(
                          "cursor-pointer transition-colors group",
                          isUnread ? "bg-primary/2 hover:bg-primary/5" : "hover:bg-muted/40"
                        )}
                        onClick={() => handleSelectEmail(email)}
                      >
                        {/* Sender Column */}
                        <TableCell className="pl-4 sm:pl-6 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Unread indicator dot */}
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 shadow-xs" title="Unread" />
                            )}

                            {/* Avatar */}
                            <div
                              className={cn(
                                "h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0",
                                getAvatarColor(senderEmail || name)
                              )}
                            >
                              {getInitials(name)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={cn(
                                  "truncate text-xs sm:text-sm",
                                  isUnread ? "font-bold text-foreground" : "font-medium text-foreground/90"
                                )}
                              >
                                {name}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate" title={senderEmail}>
                                {senderEmail}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Subject & Snippet Column */}
                        <TableCell className="py-3.5 max-w-[400px]">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span
                              className={cn(
                                "truncate text-xs sm:text-sm shrink-0 max-w-[200px] sm:max-w-[280px]",
                                isUnread ? "font-bold text-foreground" : "font-medium text-foreground"
                              )}
                            >
                              {email.subject || "(No Subject)"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate hidden md:inline">
                              — {email.text ? email.text.replace(/\s+/g, " ").substring(0, 75) : "No preview text"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Date Column */}
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap pr-4 sm:pr-6 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatEmailDate(email.date)}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleToggleRead(email, e)}
                                className="h-7 px-2 text-xs gap-1 hidden sm:flex text-muted-foreground hover:text-foreground"
                                title={isUnread ? "Mark as read" : "Mark as unread"}
                              >
                                {isUnread ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReply(email);
                                }}
                                className="h-7 px-2 text-xs gap-1 hidden sm:flex"
                                title="Reply to message"
                              >
                                <Reply className="h-3.5 w-3.5" />
                                <span>Reply</span>
                              </Button>
                            </div>
                          </div>
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

      {/* Message Reader Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {selectedEmail && (
            <>
              {/* Reader Header */}
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 overflow-hidden flex-1">
                    <DialogTitle className="text-lg sm:text-xl font-bold leading-tight">
                      {selectedEmail.subject || "(No Subject)"}
                    </DialogTitle>

                    {/* Sender Details Header Card */}
                    <div className="flex items-center gap-3 pt-1">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full border flex items-center justify-center font-bold text-sm shrink-0",
                          getAvatarColor(selectedEmail.from)
                        )}
                      >
                        {getInitials(parseSender(selectedEmail.from).name)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {parseSender(selectedEmail.from).name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &lt;{parseSender(selectedEmail.from).email}&gt;
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>
                            <strong>To:</strong> {selectedEmail.to || selectedEmail.recipientEmail || mailboxEmail || "You"}
                          </span>
                          <span>•</span>
                          <span>
                            {selectedEmail.date
                              ? (() => {
                                  const date = new Date(selectedEmail.date);
                                  return isNaN(date.getTime()) ? "-" : format(date, "PPP p");
                                })()
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Email Content Body */}
              <ScrollArea className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[52vh] bg-background">
                {selectedEmail.html ? (
                  <div
                    className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.html) }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {selectedEmail.text || "(No message content)"}
                  </div>
                )}
              </ScrollArea>

              {/* Reader Actions Footer */}
              <DialogFooter className="p-4 bg-muted/20 border-t flex flex-row sm:justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleReply(selectedEmail);
                      setSelectedEmail(null);
                    }}
                    className="gap-2 text-xs h-8"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRead(selectedEmail)}
                    className="gap-1.5 text-xs h-8"
                  >
                    {selectedEmail.isRead ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                    <span>{selectedEmail.isRead ? "Mark as Unread" : "Mark as Read"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyBody(selectedEmail.text || selectedEmail.html)}
                    className="gap-1.5 text-xs h-8"
                  >
                    {copiedBody ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedBody ? "Copied" : "Copy Body"}</span>
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={() => setSelectedEmail(null)} className="text-xs h-8">
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

