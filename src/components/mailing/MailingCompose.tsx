"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tms } from "@/lib/tms-api";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { MailingSkeleton } from "@/components/ui/loading/mailing-skeleton";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { cn } from "@/lib/utils";

// Icons
import { 
  Send, 
  Mail, 
  Users, 
  GraduationCap, 
  Radio, 
  AtSign, 
  Paperclip, 
  X, 
  Eye, 
  Edit3, 
  Bold, 
  Italic, 
  Heading2, 
  List, 
  Link2, 
  MousePointerClick, 
  Minus, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Check, 
  Trash2,
  HelpCircle,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(150, "Subject is too long"),
  body: z.string().min(1, "Message body is required"),
  to: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AUDIENCE_MODES = [
  {
    id: "manual",
    title: "Dedicated / Direct",
    badge: "Default",
    description: "Send to specific email addresses or dedicated recipients",
    icon: AtSign,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "broadcast",
    title: "Broadcast All",
    badge: "Full Reach",
    description: "All active members, coaches & managing staff",
    icon: Radio,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "members",
    title: "Active Members",
    badge: "Members",
    description: "All registered active club members",
    icon: Users,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "coaches",
    title: "Coaches Only",
    badge: "Staff",
    description: "All coaches and managing coaches",
    icon: GraduationCap,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
];

const TEMPLATES = [
  {
    name: "General Announcement",
    subject: "Important Update from The Mind Space",
    body: `<h2>Important Announcement</h2>
<p>Dear Members & Team,</p>
<p>We are pleased to share an exciting new update regarding our services and schedules.</p>
<p>Please review the details below to stay informed on what's new this season.</p>
<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:6px; background:#18181b; text-align:center;">
      <a href="https://themindspace.com" target="_blank" style="background:#18181b; border:1px solid #18181b; font-family:sans-serif; font-size:14px; line-height:1.4; color:#ffffff; padding:10px 22px; font-weight:600; display:inline-block; border-radius:6px; text-decoration:none;">
        Learn More
      </a>
    </td>
  </tr>
</table>
<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
<p style="font-size:12px; color:#6b7280;">Warm regards,<br>The Mind Space Team</p>`,
  },
  {
    name: "Session / Class Reminder",
    subject: "Upcoming Session Reminder",
    body: `<h2>Upcoming Session Reminder</h2>
<p>Hello,</p>
<p>This is a friendly reminder regarding your upcoming scheduled session. We recommend arriving 10 minutes prior to your start time.</p>
<ul>
  <li><strong>What to bring:</strong> Comfortable training gear and personal hydration.</li>
  <li><strong>Location:</strong> The Mind Space branch.</li>
</ul>
<p>If you need to reschedule or have any questions, please contact our support desk.</p>
<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
<p style="font-size:12px; color:#6b7280;">Best regards,<br>Your Coaching Team</p>`,
  },
  {
    name: "Welcome Onboard",
    subject: "Welcome to The Mind Space!",
    body: `<h2>Welcome to The Mind Space!</h2>
<p>We are thrilled to welcome you to our community.</p>
<p>Our team is dedicated to providing you with the best training, wellness, and recovery environment possible.</p>
<p>To get started, explore our mobile app or reach out to your coach anytime.</p>
<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:6px; background:#18181b; text-align:center;">
      <a href="https://themindspace.com" target="_blank" style="background:#18181b; border:1px solid #18181b; font-family:sans-serif; font-size:14px; line-height:1.4; color:#ffffff; padding:10px 22px; font-weight:600; display:inline-block; border-radius:6px; text-decoration:none;">
        Access Your Portal
      </a>
    </td>
  </tr>
</table>
<p style="font-size:12px; color:#6b7280;">Warm regards,<br>The Mind Space Team</p>`,
  },
];

function ComposeForm() {
  const searchParams = useSearchParams();
  const replyTo = searchParams.get("replyTo");
  const initialSubject = searchParams.get("subject");

  // Default is "manual" (dedicated) as requested, with sending options collapsed by default
  const [activeTab, setActiveTab] = useState("manual");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; data: string; size?: number } | null>(null);
  const [showAttachmentArea, setShowAttachmentArea] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<{ email: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      subject: initialSubject ? (initialSubject.startsWith("Re:") ? initialSubject : `Re: ${initialSubject}`) : "", 
      body: "", 
      to: replyTo || "" 
    },
  });

  const subjectValue = watch("subject") || "";
  const bodyValue = watch("body") || "";
  const toValue = watch("to") || "";

  const selectedMode = AUDIENCE_MODES.find((m) => m.id === activeTab) || AUDIENCE_MODES[0];
  const SelectedIcon = selectedMode.icon;

  const { ref: bodyRef, ...bodyRest } = register("body");

  useEffect(() => {
    tms.get("/admin/mail/profile")
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.email) {
          setSenderProfile({ email: data.email, name: data.name });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (replyTo) {
      setActiveTab("manual");
      setValue("to", replyTo);
      if (initialSubject) {
        setValue("subject", `Re: ${initialSubject.replace(/^Re:\s*/i, "")}`);
      }
    }
  }, [replyTo, initialSubject, setValue]);

  const handleAudienceChange = (modeId: string) => {
    setActiveTab(modeId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File exceeds 5MB limit. Please choose a smaller file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          data: reader.result as string,
          size: file.size,
        });
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setShowAttachmentArea(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper to insert HTML markup at cursor
  const insertMarkup = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end) || placeholder;
    const replacement = `${before}${selectedText}${after}`;

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    setValue("body", newText, { shouldValidate: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setValue("subject", tpl.subject, { shouldValidate: true });
    setValue("body", tpl.body, { shouldValidate: true });
    toast.success(`Applied "${tpl.name}" template`);
  };

  const handleAddSubjectTag = (tag: string) => {
    const cleanCurrent = subjectValue.replace(/^(\[[^\]]+\]\s*)+/, "").trim();
    setValue("subject", `${tag} ${cleanCurrent}`.trim(), { shouldValidate: true });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSubmit = (data: FormValues) => {
    let toArray: string[] = [];
    if (activeTab === "manual") {
      if (!data.to || !data.to.trim()) {
        toast.error("Please enter at least one recipient email");
        return;
      }
      toArray = data.to
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = toArray.filter((email) => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        toast.error(`Invalid email address: ${invalidEmails[0]}`);
        return;
      }
    }

    const payload = {
      mode: activeTab,
      subject: data.subject,
      body: data.body,
      to: toArray,
      attachment: attachment ? { name: attachment.name, data: attachment.data } : null,
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
          ? `Dispatched successfully to ${sentCount} recipient${sentCount === 1 ? "" : "s"}!` 
          : "Mail dispatched successfully!"
      );
      reset({ subject: "", body: "", to: "" });
      setAttachment(null);
      setShowAttachmentArea(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to send email");
    } finally {
      setIsLoading(false);
      setPendingData(null);
    }
  };

  // Recipient list preview count for manual mode
  const manualEmailsList = toValue
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e);

  return (
    <>
      <Card className="border shadow-xs rounded-xl overflow-hidden bg-card">
        {/* Header with Title & Sender Info */}
        <CardHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                Compose Message
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Draft targeted emails or send organization-wide announcements.
              </CardDescription>
            </div>

            {senderProfile && (
              <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5 text-xs shadow-xs self-start sm:self-auto">
                <span className="text-muted-foreground">From:</span>
                <span className="font-semibold text-foreground">{senderProfile.name}</span>
                <span className="text-muted-foreground hidden md:inline">&lt;{senderProfile.email}&gt;</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* 1. Collapsible Audience / Sending Options Selector */}
          <Collapsible
            open={isOptionsOpen}
            onOpenChange={setIsOptionsOpen}
            className="rounded-xl border bg-card overflow-hidden shadow-2xs transition-all"
            data-walkthrough="mail-send-mode"
          >
            {/* Header summary bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 bg-muted/15">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("p-2 rounded-lg shrink-0", selectedMode.color)}>
                  <SelectedIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Sending Option:
                    </span>
                    <span className="font-semibold text-sm text-foreground">
                      {selectedMode.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0",
                        selectedMode.id === "manual"
                          ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                          : ""
                      )}
                    >
                      {selectedMode.id === "manual" ? "Dedicated Recipient" : selectedMode.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xl">
                    {selectedMode.description}
                  </p>
                </div>
              </div>

              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs gap-1.5 shrink-0 self-start sm:self-auto font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                  <span>{isOptionsOpen ? "Hide Sending Options" : "Change Sending Option"}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground",
                      isOptionsOpen && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Collapsible content with cards */}
            <CollapsibleContent>
              <div className="p-3.5 sm:p-4 space-y-3 bg-background/50 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Choose who receives this email:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Dedicated is the default option
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {AUDIENCE_MODES.map((mode) => {
                    const isSelected = activeTab === mode.id;
                    const Icon = mode.icon;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleAudienceChange(mode.id)}
                        className={cn(
                          "relative flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className={cn("p-2 rounded-lg", mode.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {isSelected ? (
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                              {mode.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="font-semibold text-sm text-foreground">{mode.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {mode.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* 2. Dedicated Recipient Input or Group Dispatch Banner */}
            {activeTab === "manual" ? (
              <div className="space-y-2.5 p-4 rounded-xl border bg-muted/20 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="to" className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 text-amber-500" />
                    Dedicated Recipient Email Addresses
                  </Label>
                  {manualEmailsList.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {manualEmailsList.length} recipient{manualEmailsList.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>

                <Input
                  id="to"
                  placeholder="e.g. member@themindspace.com, coach@themindspace.com"
                  className="bg-background text-sm font-sans"
                  {...register("to")}
                  disabled={isLoading}
                />
                
                {/* Recipient Pills Helper */}
                {manualEmailsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {manualEmailsList.map((email, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-background border text-foreground shadow-2xs"
                      >
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{email}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = manualEmailsList.filter((_, i) => i !== idx).join(", ");
                            setValue("to", updated, { shouldValidate: true });
                          }}
                          className="hover:text-destructive text-muted-foreground ml-1 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Separate multiple addresses with commas.
                </p>
                {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20 text-xs animate-in fade-in duration-200">
                <div className={cn("p-2 rounded-lg shrink-0", selectedMode.color)}>
                  <SelectedIcon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <span>Broadcasting to: {selectedMode.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">Group Dispatch</Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    This email will be dispatched automatically to all {selectedMode.description.toLowerCase()}. No individual recipient email addresses needed.
                  </p>
                </div>
              </div>
            )}

            {/* 3. Subject Input with Quick Presets */}
            <div className="space-y-2" data-walkthrough="mail-subject">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject" className="text-sm font-semibold">
                  Subject
                </Label>
                <span
                  className={cn(
                    "text-xs font-mono transition-colors",
                    subjectValue.length > 130 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                  )}
                >
                  {subjectValue.length}/150
                </span>
              </div>

              <div className="relative">
                <Input
                  id="subject"
                  placeholder="Enter message subject..."
                  className="h-10 text-sm pr-10"
                  {...register("subject")}
                  disabled={isLoading}
                  maxLength={150}
                />
              </div>

              {/* Quick Subject Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground">Quick prefixes:</span>
                {["[Announcement]", "[Reminder]", "[Update]", "[Notice]"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddSubjectTag(tag)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>

            {/* 4. Message Body with Editor / Preview Tabs */}
            <div className="space-y-2" data-walkthrough="mail-body">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label htmlFor="body" className="text-sm font-semibold">
                  Message Content
                </Label>

                <div className="flex items-center gap-2">
                  {/* Template Picker */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Templates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {TEMPLATES.map((tpl) => (
                        <DropdownMenuItem
                          key={tpl.name}
                          onClick={() => handleApplyTemplate(tpl)}
                          className="cursor-pointer text-xs"
                        >
                          {tpl.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mode Switcher Tabs */}
                  <div className="flex rounded-lg border bg-muted/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => setEditorMode("write")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                        editorMode === "write"
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Edit3 className="h-3 w-3" />
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode("preview")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                        editorMode === "preview"
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      Email Preview
                    </button>
                  </div>
                </div>
              </div>

              {editorMode === "write" ? (
                <div className="space-y-2">
                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/30 border rounded-t-lg text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkup("<strong>", "</strong>", "bold text")}
                      className="h-7 w-7 p-0"
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkup("<em>", "</em>", "italic text")}
                      className="h-7 w-7 p-0"
                      title="Italic"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkup("<h2>", "</h2>", "Heading Title")}
                      className="h-7 w-7 p-0"
                      title="Heading"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkup("<ul>\n  <li>", "</li>\n</ul>", "List item")}
                      className="h-7 w-7 p-0"
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkup('<a href="https://" target="_blank">', "</a>", "Link text")}
                      className="h-7 w-7 p-0"
                      title="Insert Link"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        insertMarkup(
                          '<table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;"><tr><td style="border-radius:6px; background:#18181b; text-align:center;"><a href="https://" target="_blank" style="background:#18181b; border:1px solid #18181b; font-family:sans-serif; font-size:14px; line-height:1.4; color:#ffffff; padding:10px 20px; font-weight:600; display:inline-block; border-radius:6px; text-decoration:none;">',
                          "</a></td></tr></table>",
                          "Button Call-to-Action"
                        )
                      }
                      className="h-7 px-2 text-[11px] gap-1"
                      title="Insert CTA Button"
                    >
                      <MousePointerClick className="h-3.5 w-3.5" />
                      <span>CTA Button</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkup('<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />\n')}
                      className="h-7 w-7 p-0"
                      title="Horizontal Divider"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>

                    <div className="ml-auto text-[11px] text-muted-foreground hidden sm:inline px-2">
                      HTML & Plain text supported
                    </div>
                  </div>

                  {/* Body Textarea */}
                  <Textarea
                    id="body"
                    ref={(e) => {
                      bodyRef(e);
                      // @ts-ignore
                      textareaRef.current = e;
                    }}
                    {...bodyRest}
                    placeholder="Write your email body here... HTML tags like <p>, <strong>, <a>, and <ul> are rendered cleanly."
                    className="min-h-[260px] font-sans text-sm leading-relaxed rounded-t-none border-t-0 focus-visible:ring-1"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                /* Live Email Client Preview */
                <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
                  {/* Mock Email Header */}
                  <div className="p-4 border-b bg-muted/30 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground w-16">From:</span>
                      <span className="text-foreground font-medium">
                        {senderProfile?.name || "The Mind Space"} &lt;{senderProfile?.email || "mail@themindspace.com"}&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground w-16">To:</span>
                      <span className="text-foreground">
                        {activeTab === "broadcast" && "All Active Users & Coaches (Broadcast)"}
                        {activeTab === "members" && "All Active Members"}
                        {activeTab === "coaches" && "All Coaches & Staff"}
                        {activeTab === "manual" && (toValue || "Dedicated recipients")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground w-16">Subject:</span>
                      <span className="font-bold text-foreground">{subjectValue || "(No subject set)"}</span>
                    </div>
                  </div>

                  {/* Rendered Email Preview Container */}
                  <div className="p-6 min-h-[220px] bg-background">
                    {bodyValue ? (
                      <div
                        className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyValue) }}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        Start drafting your message to see how it looks to your recipients.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            </div>

            {/* 5. Attachment Section */}
            <div data-walkthrough="mail-attachment" className="pt-0.5">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />

              {attachment ? (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      Attached File
                    </Label>
                  </div>

                  <div className="flex items-center justify-between p-2 sm:p-2.5 border rounded-lg bg-card shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                          {attachment.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAttachment}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : showAttachmentArea ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      Attachment (Optional)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAttachmentArea(false)}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all bg-muted/10 text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground">Click to upload file</div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          PDF, Images, or Documents up to 5MB
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                      Browse
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAttachmentArea(true)}
                    className="h-8 px-2.5 text-xs gap-1.5 font-medium text-muted-foreground hover:text-foreground cursor-pointer rounded-lg border-dashed"
                    title="Add an attachment"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-primary" />
                    <span>Attach File</span>
                  </Button>
                  <span className="text-[11px] text-muted-foreground">Optional (PDF, Images, Docs up to 5MB)</span>
                </div>
              )}
            </div>

            {/* 6. Footer Action Bar */}
            <div className="pt-4 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-3" data-walkthrough="mail-send-button">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset({ subject: "", body: "", to: "" });
                  setAttachment(null);
                  setShowAttachmentArea(false);
                }}
                disabled={isLoading}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Form
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto gap-2 shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  {isLoading ? "Dispatching..." : activeTab === "manual" ? "Send Dedicated Email" : `Broadcast to ${selectedMode.title}`}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Broadcast / Group Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Confirm Group Broadcast</DialogTitle>
            <DialogDescription className="text-sm">
              You are about to dispatch an email to the{" "}
              <strong className="text-foreground capitalize">{pendingData?.mode}</strong> group. This mass action delivers immediately and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/40 border rounded-lg space-y-1.5 text-xs my-2">
            <div>
              <span className="font-semibold text-foreground">Subject: </span>
              <span className="text-muted-foreground">{pendingData?.subject}</span>
            </div>
            {attachment && (
              <div>
                <span className="font-semibold text-foreground">Attachment: </span>
                <span className="text-muted-foreground">{attachment.name}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => sendMailRequest(pendingData)} disabled={isLoading} className="gap-1.5">
              <Send className="h-4 w-4" />
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

