"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { tms } from "@/lib/tms-api";
import { toast } from "react-hot-toast";

// Icons
import { Mail, Send, Users, UserPlus, FileText, CheckCircle2, XCircle } from "lucide-react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(150, "Subject is too long"),
  body: z.string().min(1, "Message body is required"),
  to: z.string().optional(), // Used only for manual
});

type FormValues = z.infer<typeof formSchema>;

type MailLog = {
  _id: string;
  mode: string;
  subject: string;
  recipients: number | string[];
  sent_at: string;
  status: string;
};

export default function MailingPage() {
  const [activeTab, setActiveTab] = useState("broadcast");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", body: "", to: "" },
  });

  const subjectValue = watch("subject", "");

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    reset({ subject: "", body: "", to: "" });
    setAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          data: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment(null);
    }
  };

  const onSubmit = (data: FormValues) => {
    let toArray: string[] = [];
    if (activeTab === "manual") {
      if (!data.to) {
        toast.error("Please enter recipient emails");
        return;
      }
      toArray = data.to.split(",").map(e => e.trim()).filter(e => e);
    }

    const payload = {
      mode: activeTab,
      subject: data.subject,
      body: data.body,
      to: toArray,
      attachment,
    };

    if (activeTab === "manual") {
      sendMailRequest(payload);
    } else {
      setPendingData(payload);
      setConfirmModalOpen(true);
    }
  };

  const sendMailRequest = async (payload: any) => {
    setIsLoading(true);
    setConfirmModalOpen(false);
    try {
      const response = await tms.post("/admin/mail/send", payload);
      toast.success(`Successfully sent to ${response.data.sent} recipients!`);
      reset();
      setAttachment(null);
      fetchLogs();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send email");
    } finally {
      setIsLoading(false);
      setPendingData(null);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Mailing System
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>Send emails to groups or specific addresses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="broadcast">📢 Broadcast</TabsTrigger>
                <TabsTrigger value="members">👥 Members</TabsTrigger>
                <TabsTrigger value="coaches">🏋️ Coaches</TabsTrigger>
                <TabsTrigger value="manual">✏️ Manual</TabsTrigger>
              </TabsList>

              <div className="text-sm text-muted-foreground mb-4 mt-2">
                {activeTab === "broadcast" && "Send to all active members and all coaches."}
                {activeTab === "members" && "Send to all active members only."}
                {activeTab === "coaches" && "Send to all coaches only."}
                {activeTab === "manual" && "Compose and send to specific email addresses."}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {activeTab === "manual" && (
                  <div className="space-y-2">
                    <Label htmlFor="to">To (comma-separated)</Label>
                    <Input
                      id="to"
                      placeholder="e.g. john@example.com, jane@example.com"
                      {...register("to")}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="subject">Subject</Label>
                    <span className="text-xs text-muted-foreground">{subjectValue.length}/150</span>
                  </div>
                  <Input
                    id="subject"
                    placeholder="Email Subject"
                    maxLength={150}
                    {...register("subject")}
                  />
                  {errors.subject && <span className="text-xs text-red-500">{errors.subject.message}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message Body (HTML supported)</Label>
                  <Textarea
                    id="body"
                    placeholder="Write your message here..."
                    className="min-h-[200px]"
                    {...register("body")}
                  />
                  {errors.body && <span className="text-xs text-red-500">{errors.body.message}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment (Optional)</Label>
                  <Input
                    id="attachment"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>Sending... ⏳</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Email
                    </>
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Email History</CardTitle>
            <CardDescription>Recently sent emails.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mode</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No emails sent yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="capitalize">{log.mode}</TableCell>
                        <TableCell className="truncate max-w-[120px]" title={log.subject}>
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(log.recipients) ? log.recipients.length : log.recipients}
                        </TableCell>
                        <TableCell>
                          {log.status === "sent" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" /> Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(log.sent_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Broadcast</DialogTitle>
            <DialogDescription>
              You are about to send an email using the <strong>{activeTab}</strong> mode. This action cannot be undone. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => sendMailRequest(pendingData)}>
              Yes, Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
