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
import { ScrollArea } from "@/components/ui/scroll-area";

type MailLog = {
  _id: string;
  mode: string;
  subject: string;
  body: string;
  recipients: number | string[];
  sent_at: string;
  status: string;
  error_msg?: string;
};

export default function SentPage() {
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMail, setSelectedMail] = useState<MailLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await tms.get("/admin/mail/logs");
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.subject.toLowerCase().includes(search.toLowerCase()) || 
    log.mode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card className="border-none shadow-sm h-full flex flex-col">
        <CardHeader className="px-0 pt-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Sent Mail</CardTitle>
              <CardDescription>History of all broadcasted and manually sent emails.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search subject..."
                className="pl-8 bg-muted/50 border-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0">
              <TableRow>
                <TableHead className="w-[100px]">Mode</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <MailOpen className="h-8 w-8 text-muted-foreground/50" />
                      <p>No sent emails found.</p>
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
                    <TableCell>
                      <Badge variant="outline" className="capitalize bg-background">
                        {log.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-[300px]" title={log.subject}>
                      {log.subject}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {Array.isArray(log.recipients) ? log.recipients.join(", ") : `${log.recipients} people`}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.sent_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.status === "sent" ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                          <XCircle className="w-3 h-3 mr-1" /> Failed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMail} onOpenChange={(open) => !open && setSelectedMail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {selectedMail && (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl leading-tight mb-2">
                      {selectedMail.subject}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-xs">{selectedMail.mode}</Badge>
                      <span>•</span>
                      <span>{format(new Date(selectedMail.sent_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>
                  {selectedMail.status === "sent" ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none shrink-0">Successfully Sent</Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0">Failed</Badge>
                  )}
                </div>
              </DialogHeader>
              
              <div className="px-6 py-3 border-b text-sm bg-muted/10 grid grid-cols-[80px_1fr] gap-2">
                <span className="text-muted-foreground font-medium">To:</span>
                <span className="text-foreground">
                  {Array.isArray(selectedMail.recipients) 
                    ? selectedMail.recipients.join(", ") 
                    : `${selectedMail.recipients} recipients (Broadcast)`}
                </span>
                
                {selectedMail.error_msg && (
                  <>
                    <span className="text-red-500 font-medium mt-2">Error:</span>
                    <span className="text-red-500 mt-2">{selectedMail.error_msg}</span>
                  </>
                )}
              </div>

              <ScrollArea className="flex-1 p-6">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: selectedMail.body }}
                />
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
