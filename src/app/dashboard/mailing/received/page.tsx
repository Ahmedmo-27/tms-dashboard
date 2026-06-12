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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type ReceivedEmail = {
  _id: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: string;
  isRead: boolean;
};

export default function ReceivedPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await tms.get("/admin/mail/inbox");
      setEmails(response.data);
    } catch (error) {
      console.error("Failed to fetch inbox", error);
    }
  };

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(search.toLowerCase()) || 
    email.from.toLowerCase().includes(search.toLowerCase())
  );

  const handleReply = (email: ReceivedEmail) => {
    // Extract actual email if it's in the format "Name <email@domain.com>"
    const match = email.from.match(/<(.+)>/);
    const replyEmail = match ? match[1] : email.from;
    
    // Navigate to compose with pre-filled fields
    router.push(`/dashboard/mailing?replyTo=${encodeURIComponent(replyEmail)}&subject=${encodeURIComponent(email.subject)}`);
  };

  return (
    <>
      <Card className="border-none shadow-sm h-full flex flex-col">
        <CardHeader className="px-0 pt-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Inbox</CardTitle>
              <CardDescription>Emails received at your administrative address.</CardDescription>
            </div>
            <div className="relative w-64">
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
        <CardContent className="px-0 py-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0">
              <TableRow>
                <TableHead className="w-[250px]">From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 text-muted-foreground/50" />
                      <p>Your inbox is empty.</p>
                      <p className="text-xs">Emails sent to your Gmail will be synced here automatically.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmails.map((email) => (
                  <TableRow 
                    key={email._id} 
                    className={`cursor-pointer transition-colors ${email.isRead ? 'opacity-80' : 'bg-muted/10 font-medium'}`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <TableCell className="truncate max-w-[250px]" title={email.from}>
                      <div className="flex items-center gap-2">
                        {!email.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        {email.from.replace(/<.*>/, "")}
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[400px]" title={email.subject}>
                      {email.subject || "(No Subject)"}
                    </TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      {format(new Date(email.date), "MMM d, yyyy h:mm a")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {selectedEmail && (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl leading-tight mb-2">
                      {selectedEmail.subject || "(No Subject)"}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{format(new Date(selectedEmail.date), "MMMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="px-6 py-4 border-b text-sm bg-muted/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">{selectedEmail.from}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleReply(selectedEmail)} className="shrink-0 gap-2">
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
              </div>

              <ScrollArea className="flex-1 p-6 bg-white dark:bg-zinc-950">
                {selectedEmail.html ? (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-sm">
                    {selectedEmail.text}
                  </div>
                )}
              </ScrollArea>
              
              <DialogFooter className="p-4 border-t bg-muted/20 sm:justify-start">
                <Button onClick={() => handleReply(selectedEmail)} className="gap-2">
                  <Reply className="h-4 w-4" />
                  Reply to Sender
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
