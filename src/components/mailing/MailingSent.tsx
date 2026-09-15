"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tms } from "@/lib/tms-api";
import { CheckCircle2, XCircle, Search, MailOpen } from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type MailLog = {
  _id: string;
  mode: string;
  subject: string;
  body: string;
  recipients: number | string[];
  sent_at: string;
  status: string;
  error_msg?: string;
};

export function MailingSent() {
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMail, setSelectedMail] = useState<MailLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await tms.get("/admin/mail/logs");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch logs", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => 
    (log.subject || "").toLowerCase().includes(search.toLowerCase()) || 
    (log.mode || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card className="border-none shadow-sm h-full flex flex-col">
        <CardHeader className="px-4 sm:px-6 pt-0 pb-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Sent Messages</CardTitle>
              <CardDescription>Track all outgoing broadcast and transactional emails.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search subject or mode..."
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
                <TableHead className="w-[100px] pl-4 sm:pl-6">Status</TableHead>
                <TableHead className="w-[120px]">Audience</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[120px] text-center">Recipients</TableHead>
                <TableHead className="w-[150px] text-right pr-4 sm:pr-6">Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-12 text-center text-muted-foreground animate-pulse">
                      Loading history...
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MailOpen className="h-8 w-8 text-muted-foreground/50" />
                      <p>No sent emails found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow 
                    key={log._id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedMail(log)}
                  >
                    <TableCell className="pl-4 sm:pl-6">
                      {log.status === "sent" ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {log.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] sm:max-w-[300px] truncate">
                      {log.subject}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {typeof log.recipients === "number" 
                        ? log.recipients 
                        : Array.isArray(log.recipients) 
                        ? log.recipients.length 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground pr-4 sm:pr-6">
                      {log.sent_at ? format(new Date(log.sent_at), "MMM d, h:mm a") : "-"}
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

      {/* Message Preview Dialog */}
      <Dialog open={!!selectedMail} onOpenChange={(open) => !open && setSelectedMail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {selectedMail && (
            <>
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <DialogTitle className="text-xl font-bold">{selectedMail.subject}</DialogTitle>
                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                      <span className="capitalize">Target: {selectedMail.mode}</span>
                      <span>•</span>
                      <span>
                        Sent on {selectedMail.sent_at ? format(new Date(selectedMail.sent_at), "PPP p") : ""}
                      </span>
                    </div>
                  </div>
                  <Badge variant={selectedMail.status === "sent" ? "outline" : "destructive"}>
                    {selectedMail.status}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6 max-h-[50vh]">
                <div 
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedMail.body }}
                />
              </ScrollArea>

              {selectedMail.error_msg && (
                <div className="p-4 bg-destructive/10 border-t text-xs text-destructive">
                  <strong>Error details:</strong> {selectedMail.error_msg}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
