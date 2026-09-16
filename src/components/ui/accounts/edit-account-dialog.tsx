"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/lib/hooks/use-locations";
import { updateAccount } from "@/lib/data/accounts";
import {
  type AccountRole,
  type UserAccount,
  isEmailEligibleRole,
} from "@/types/accounts";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import {
  UserCog,
  Eye,
  EyeOff,
  Wand2,
  CheckCircle2,
  XCircle,
  Copy,
  Loader2,
  ShieldAlert,
  Mail,
} from "lucide-react";

interface EditAccountDialogProps {
  account: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountUpdated: () => void;
}

const PASSWORD_RULES = [
  { id: "length", label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { id: "letter", label: "At least one letter (a–z)", test: (p: string) => /[a-zA-Z]/.test(p) },
  { id: "number", label: "One number (0–9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  onAccountUpdated,
}: EditAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("management");
  const [locationId, setLocationId] = useState<string>("");
  const [tmsEmail, setTmsEmail] = useState("");
  const [sendAsName, setSendAsName] = useState("");
  const [copied, setCopied] = useState(false);

  const { locations, isLoading: locationsLoading } = useLocations(true);

  useEffect(() => {
    if (account) {
      setName(account.name || "");
      setPhoneNumber(account.phoneNumber || "");
      setEmail(account.email || "");
      setRole(account.role || "management");
      setPassword("");

      const locId =
        typeof account.locationId === "object" && account.locationId !== null
          ? account.locationId._id
          : account.locationId || "";
      setLocationId(locId);

      setTmsEmail(account.tmsEmail || "");
      setSendAsName(account.sendAsName || "");
    }
  }, [account]);

  const passwordRulesMet = !password || PASSWORD_RULES.every((rule) => rule.test(password));

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const specials = "!@#$%^&*";

    let generated = "Tms";
    for (let i = 0; i < 4; i++) {
      generated += chars[Math.floor(Math.random() * chars.length)];
    }
    for (let i = 0; i < 3; i++) {
      generated += nums[Math.floor(Math.random() * nums.length)];
    }
    generated += specials[Math.floor(Math.random() * specials.length)];
    setPassword(generated);
  };

  const copyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!", { duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^\d{11}$/.test(cleanPhone)) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }

    if (!email.trim() || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (password && !passwordRulesMet) {
      toast.error("New password does not meet security requirements");
      return;
    }

    if (role === "branch_admin" && !locationId) {
      toast.error("Branch admin role requires selecting an assigned branch location");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAccount(account._id, {
        name: name.trim(),
        phoneNumber: cleanPhone,
        email: email.trim().toLowerCase(),
        role,
        locationId: role === "branch_admin" ? locationId : null,
        password: password ? password : undefined,
        tmsEmail: isEmailEligibleRole(role)
          ? tmsEmail.trim()
            ? tmsEmail.trim().toLowerCase()
            : null
          : null,
        sendAsName: isEmailEligibleRole(role)
          ? sendAsName.trim()
            ? sendAsName.trim()
            : null
          : null,
      });

      toast.success(`Account for ${name} updated successfully!`);
      onOpenChange(false);
      onAccountUpdated();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update account";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Edit Account & Role
          </DialogTitle>
          <DialogDescription>
            Update user permissions, change roles, or reset account access credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g. Ahmed Mostafa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone Number (11 digits) *</Label>
              <Input
                id="edit-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={11}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email Address *</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Account Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AccountRole)}>
              <SelectTrigger id="edit-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="management">
                  Management (Global Operations & Full Access)
                </SelectItem>
                <SelectItem value="branch_admin">
                  Branch Admin (Locked to Assigned Branch)
                </SelectItem>
                <SelectItem value="coach">Coach (Trainer / Coach Portal)</SelectItem>
                <SelectItem value="managing_coach">Managing Coach (Head Trainer)</SelectItem>
                <SelectItem value="mailer">Mailer (Brevo Marketing & Inbox)</SelectItem>
                <SelectItem value="member">Member (Gym Trainee Account)</SelectItem>
                <SelectItem value="user">User (Mobile App Client Account)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Branch Selection for branch_admin */}
          {role === "branch_admin" && (
            <div className="space-y-1.5 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
              <Label htmlFor="edit-branch" className="text-blue-900 dark:text-blue-200">
                Assigned Branch Location *
              </Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger id="edit-branch" className="bg-background">
                  <SelectValue placeholder="Choose branch location..." />
                </SelectTrigger>
                <SelectContent>
                  {locationsLoading ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      Loading branches...
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No branches found
                    </div>
                  ) : (
                    locations.map((loc) => (
                      <SelectItem key={loc._id} value={loc._id}>
                        {loc.branchName} ({loc.location})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Branch admins can only operate and check in trainees at this specific branch.
              </p>
            </div>
          )}

          {/* Email Variables Section for Eligible Roles */}
          {isEmailEligibleRole(role) && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Email Variables & Outbound Identity
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 border-amber-300 text-amber-800 dark:text-amber-300 dark:border-amber-800 font-normal"
                >
                  Eligible Role ({role})
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Configures outbound sending identity for Brevo broadcasts and incoming message routing in the IMAP inbox.
              </p>

              <div className="space-y-3 pt-1">
                {/* TMS Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-tmsemail" className="text-xs">
                      TMS Sender Email (tmsEmail)
                    </Label>
                    {name && (
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = name
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]/g, "");
                          if (prefix) setTmsEmail(`${prefix}@the-mind-space.com`);
                        }}
                        className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Auto-generate @the-mind-space.com
                      </button>
                    )}
                  </div>
                  <Input
                    id="edit-tmsemail"
                    type="email"
                    placeholder="e.g. newsletter@the-mind-space.com or management@the-mind-space.com"
                    value={tmsEmail}
                    onChange={(e) => setTmsEmail(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Sender email for Brevo outgoing communications and IMAP reply routing.
                  </p>
                </div>

                {/* Send-As Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-sendas" className="text-xs">
                      Send-As Display Name (sendAsName)
                    </Label>
                    {name && (
                      <button
                        type="button"
                        onClick={() => setSendAsName(name.trim())}
                        className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Use account name
                      </button>
                    )}
                  </div>
                  <Input
                    id="edit-sendas"
                    placeholder="e.g. The Mind Space Team or Management Office"
                    value={sendAsName}
                    onChange={(e) => setSendAsName(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Friendly sender name shown to recipients in their email inbox.
                  </p>
                </div>

                {/* Live Preview */}
                <div className="rounded border border-amber-200/60 bg-background/80 p-2 text-xs">
                  <span className="text-muted-foreground text-[11px] block mb-0.5 font-medium">
                    Outbound Identity Preview:
                  </span>
                  <div className="font-mono text-[11px] text-foreground flex items-center gap-1 overflow-hidden text-ellipsis">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">From:</span>
                    <span>&quot;{sendAsName.trim() || name.trim() || "The Mind Space"}&quot;</span>
                    <span className="text-muted-foreground">
                      &lt;
                      {tmsEmail.trim() ||
                        (email.trim() && email.includes("@")
                          ? email.trim()
                          : "info@the-mind-space.com")}
                      &gt;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reset Password (Optional) */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-password">Reset Password</Label>
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep existing password
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={generatePassword}
                >
                  <Wand2 className="h-3 w-3" />
                  Generate
                </Button>
                {password && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={copyPassword}
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password to change"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password checklist if password was typed */}
            {password && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 ${
                        passed ? "text-emerald-600 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (Boolean(password) && !passwordRulesMet)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

