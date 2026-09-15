"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tms } from "@/lib/tms-api";
import { Search, Inbox, Reply, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function MailingInbox({ composeUrl = "/dashboard/mailing" }: MailingInboxProps) {
  const router = useRouter();
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [mailboxEmail, setMailboxEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmails();
    tms.get("/admin/mail/profile")
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.email) setMailboxEmail(data.email);
      })
      .catch(() => {});
  }, []);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await tms.get("/admin/mail/inbox");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setEmails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch inbox", error);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmails = (Array.isArray(emails) ? emails : []).filter(email => 
    (email.subject || "").toLowerCase().includes(search.toLowerCase()) || 
    (email.from || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleReply = (email: ReceivedEmail) => {
    // Extract actual email if it's in the format "Name <email@domain.com>"
    const match = email.from.match(/<(.+)>/);
    const replyEmail = match ? match[1] : email.from;
    
    // Navigate to compose with pre-filled fields
    router.push(`${composeUrl}?replyTo=${encodeURIComponent(replyEmail)}&subject=${encodeURIComponent(email.subject || "")}`);
  };

  return (
    <>
      <Card className="border-none shadow-sm h-full flex flex-col">
        <CardHeader className="px-4 sm:px-6 pt-0 pb-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Inbox</CardTitle>
              <CardDescription>
                {mailboxEmail ? (
                  <>Inbox for <span className="font-semibold text-foreground">{mailboxEmail}</span></>
                ) : (
                  "Emails received at your personal mailbox address."
                )}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search sender or subject..."
                className="pl-8 bg-muted/50 border-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0 flex-1">
          <ScrollArea className="h-full w-full">
            <Table>
            <TableHeader className="bg-muted/30 sticky top-0">
              <TableRow>
                <TableHead className="w-[200px] sm:w-[250px] pl-4 sm:pl-6">From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[120px] sm:w-[150px] text-right pr-4 sm:pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3} className="h-12 text-center text-muted-foreground animate-pulse">
                      Loading messages...
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredEmails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 text-muted-foreground/50" />
                      <p>No emails found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmails.map((email) => (
                  <TableRow 
                    key={email._id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <TableCell className="font-medium text-sm pl-4 sm:pl-6 max-w-[200px] truncate">
                      {email.from}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm">
                      <span className="font-medium text-foreground">{email.subject || "(No Subject)"}</span>
                      <span className="text-muted-foreground ml-2">
                        - {email.text ? email.text.substring(0, 60) : ""}...
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap pr-4 sm:pr-6">
                      {email.date ? (
                        (() => {
                          const date = new Date(email.date);
                          return isNaN(date.getTime()) ? "Unknown date" : format(date, "MMM d, h:mm a");
                        })()
                      ) : (
                        "Unknown date"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Reader Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {selectedEmail && (
            <>
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 overflow-hidden pr-6">
                    <DialogTitle className="text-xl font-bold truncate">
                      {selectedEmail.subject || "(No Subject)"}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-4 sm:flex-wrap">
                      <span><strong>From:</strong> {selectedEmail.from}</span>
                      {(selectedEmail.to || selectedEmail.recipientEmail || mailboxEmail) && (
                        <span>
                          <strong>To:</strong>{" "}
                          {selectedEmail.to || selectedEmail.recipientEmail || mailboxEmail}
                        </span>
                      )}
                      <span><strong>Date:</strong> {selectedEmail.date ? (
                        (() => {
                          const date = new Date(selectedEmail.date);
                          return isNaN(date.getTime()) ? "Unknown date" : format(date, "PPP p");
                        })()
                      ) : (
                        "Unknown date"
                      )}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Email Content Body */}
              <ScrollArea className="flex-1 p-6 overflow-y-auto max-h-[50vh]">
                {selectedEmail.html ? (
                  <div 
                    className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.html) }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {selectedEmail.text}
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="p-4 bg-muted/20 border-t flex sm:justify-between items-center">
                <Button 
                  variant="default" 
                  onClick={() => {
                    handleReply(selectedEmail);
                    setSelectedEmail(null);
                  }}
                  className="gap-2"
                >
                  <Reply className="h-4 w-4" /> Reply
                </Button>
                <Button variant="outline" onClick={() => setSelectedEmail(null)}>
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
