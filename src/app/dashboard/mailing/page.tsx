"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tms } from "@/lib/tms-api";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

// Icons
import { Send } from "lucide-react";

// UI Components
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      toast.success(`Successfully sent to ${response.data.sent} recipients!`);
      reset();
      setAttachment(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send email");
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
              <TabsTrigger value="broadcast" className="data-[state=active]:bg-background">📢 Broadcast</TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-background">👥 Members</TabsTrigger>
              <TabsTrigger value="coaches" className="data-[state=active]:bg-background">🏋️ Coaches</TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:bg-background">✏️ Manual</TabsTrigger>
            </TabsList>

            <div className="text-sm text-muted-foreground mb-4 mt-2 px-2">
              {activeTab === "broadcast" && "Send to all active members and all coaches."}
              {activeTab === "members" && "Send to all active members only."}
              {activeTab === "coaches" && "Send to all coaches only."}
              {activeTab === "manual" && "Compose and send to specific email addresses."}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card border rounded-lg p-6">
              {activeTab === "manual" && (
                <div className="space-y-2">
                  <Label htmlFor="to" className="text-sm font-semibold">To</Label>
                  <Input
                    id="to"
                    placeholder="e.g. john@example.com, jane@example.com"
                    className="border-muted-foreground/20 focus-visible:ring-primary/50"
                    {...register("to")}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="subject" className="text-sm font-semibold">Subject</Label>
                  <span className="text-xs text-muted-foreground">{subjectValue.length}/150</span>
                </div>
                <Input
                  id="subject"
                  placeholder="Email Subject"
                  maxLength={150}
                  className="border-muted-foreground/20 focus-visible:ring-primary/50"
                  {...register("subject")}
                />
                {errors.subject && <span className="text-xs text-destructive">{errors.subject.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm font-semibold">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Write your message here..."
                  className="min-h-[250px] resize-y border-muted-foreground/20 focus-visible:ring-primary/50"
                  {...register("body")}
                />
                {errors.body && <span className="text-xs text-destructive">{errors.body.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachment" className="text-sm font-semibold">Attachment <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  className="cursor-pointer file:cursor-pointer border-muted-foreground/20"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isLoading} size="lg" className="px-8 shadow-md">
                  {isLoading ? (
                    <>Sending... ⏳</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Broadcast</DialogTitle>
            <DialogDescription>
              You are about to send an email using the <strong className="capitalize">{activeTab}</strong> mode. This action cannot be undone. Are you sure you want to proceed?
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
    </>
  );
}

export default function MailingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading composer...</div>}>
      <ComposeForm />
    </Suspense>
  );
}
