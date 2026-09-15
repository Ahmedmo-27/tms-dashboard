"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tms } from "@/lib/tms-api";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { MailingSkeleton } from "@/components/ui/loading/mailing-skeleton";

// Icons
import { Send } from "lucide-react";

// UI Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

function ComposeForm() {
  const searchParams = useSearchParams();
  const replyTo = searchParams.get("replyTo");
  const initialSubject = searchParams.get("subject");

  const [activeTab, setActiveTab] = useState(replyTo ? "manual" : "broadcast");
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      subject: initialSubject ? `Re: ${initialSubject}` : "", 
      body: "", 
      to: replyTo || "" 
    },
  });

  const subjectValue = watch("subject", "");

  useEffect(() => {
    if (replyTo) {
      setActiveTab("manual");
      setValue("to", replyTo);
      if (initialSubject) {
        setValue("subject", `Re: ${initialSubject.replace(/^Re:\s*/i, "")}`);
      }
    }
  }, [replyTo, initialSubject, setValue]);

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
      const sentCount = response.data?.data?.sent ?? response.data?.sent;
      toast.success(
        sentCount !== undefined 
          ? `Successfully sent to ${sentCount} recipients!` 
          : "Mail sent successfully!"
      );
      reset();
      setAttachment(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to send email");
    } finally {
      setIsLoading(false);
      setPendingData(null);
    }
  };

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">New Message</CardTitle>
          <CardDescription>Compose and send an email to your members or coaches.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="px-6 mb-6" data-walkthrough="mail-send-mode">
            <Label className="text-sm font-semibold mb-2 block">Send Mode</Label>
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select send mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">Broadcast (All Active Users & Coaches)</SelectItem>
                <SelectItem value="members">Active Members Only</SelectItem>
                <SelectItem value="coaches">Coaches Only</SelectItem>
                <SelectItem value="manual">Specific Recipients</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6">
            {activeTab === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="to">To (comma-separated)</Label>
                <Input
                  id="to"
                  placeholder="john@example.com, sara@example.com"
                  {...register("to")}
                  disabled={isLoading}
                />
                {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
              </div>
            )}

            <div className="space-y-2" data-walkthrough="mail-subject">
              <div className="flex justify-between items-center">
                <Label htmlFor="subject">Subject</Label>
                <span className="text-xs text-muted-foreground">
                  {subjectValue.length} / 150
                </span>
              </div>
              <Input
                id="subject"
                placeholder="Important Announcement..."
                {...register("subject")}
                disabled={isLoading}
                maxLength={150}
              />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="space-y-2" data-walkthrough="mail-body">
              <Label htmlFor="body">Message Body (HTML supported)</Label>
              <Textarea
                id="body"
                placeholder="<p>Hello everyone,</p><p>We are excited to announce...</p>"
                className="min-h-[220px] font-mono text-sm leading-relaxed"
                {...register("body")}
                disabled={isLoading}
              />
              {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            </div>

            <div className="space-y-2" data-walkthrough="mail-attachment">
              <Label htmlFor="attachment">Attachment (Optional, max 5MB)</Label>
              <Input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                className="cursor-pointer"
              />
              {attachment && (
                <p className="text-xs text-muted-foreground mt-1">
                  Attached: {attachment.name}
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end" data-walkthrough="mail-send-button">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Broadcast / Group Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Group Email</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this message to the <strong>{pendingData?.mode}</strong> group?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground my-2">
            <p><strong>Subject:</strong> {pendingData?.subject}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button onClick={() => sendMailRequest(pendingData)} disabled={isLoading}>
              {isLoading ? "Sending..." : "Yes, Send Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MailingCompose() {
  return (
    <Suspense fallback={<MailingSkeleton />}>
      <ComposeForm />
    </Suspense>
  );
}
