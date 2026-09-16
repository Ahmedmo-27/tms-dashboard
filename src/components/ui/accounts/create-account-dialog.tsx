"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createAccount } from "@/lib/data/accounts";
import type { AccountRole } from "@/types/accounts";
import { toast } from "react-hot-toast";
import {
  UserPlus,
  Eye,
  EyeOff,
  Wand2,
  CheckCircle2,
  XCircle,
  Copy,
  Loader2,
} from "lucide-react";

interface CreateAccountDialogProps {
  onAccountCreated: () => void;
}

const PASSWORD_RULES = [
  { id: "length", label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { id: "letter", label: "At least one letter (a–z)", test: (p: string) => /[a-zA-Z]/.test(p) },
  { id: "number", label: "One number (0–9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export function CreateAccountDialog({ onAccountCreated }: CreateAccountDialogProps) {
  const [open, setOpen] = useState(false);
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

  const allRulesMet = PASSWORD_RULES.every((rule) => rule.test(password));

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

  const resetForm = () => {
    setName("");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setRole("management");
    setLocationId("");
    setTmsEmail("");
    setSendAsName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!allRulesMet) {
      toast.error("Password does not meet security requirements");
      return;
    }

    if (role === "branch_admin" && !locationId) {
      toast.error("Please select a branch location for the branch admin");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccount({
        name: name.trim(),
        phoneNumber: cleanPhone,
        email: email.trim().toLowerCase(),
        password,
        role,
        locationId: role === "branch_admin" ? locationId : undefined,
        tmsEmail: role === "mailer" && tmsEmail.trim() ? tmsEmail.trim().toLowerCase() : undefined,
        sendAsName: role === "mailer" && sendAsName.trim() ? sendAsName.trim() : undefined,
      });

      toast.success(`Account for ${name} (${role}) created successfully!`);
      resetForm();
      setOpen(false);
      onAccountCreated();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create account";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Add Account</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Account
          </DialogTitle>
          <DialogDescription>
            Create an account with designated roles and operational permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Full Name *</Label>
              <Input
                id="acc-name"
                placeholder="e.g. Omar Tolan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-phone">Phone Number (11 digits) *</Label>
              <Input
                id="acc-phone"
                placeholder="01012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={11}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-email">Email Address *</Label>
            <Input
              id="acc-email"
              type="email"
              placeholder="user@the-mind-space.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-role">Account Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AccountRole)}>
              <SelectTrigger id="acc-role">
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
              <Label htmlFor="acc-branch" className="text-blue-900 dark:text-blue-200">
                Assigned Branch Location *
              </Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger id="acc-branch" className="bg-background">
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
                Branch admins can only view, check in, and manage operations at this specific branch.
              </p>
            </div>
          )}

          {/* Conditional Mailer Fields */}
          {role === "mailer" && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="space-y-1.5">
                <Label htmlFor="acc-tmsemail">TMS Email (Optional)</Label>
                <Input
                  id="acc-tmsemail"
                  type="email"
                  placeholder="newsletter@the-mind-space.com"
                  value={tmsEmail}
                  onChange={(e) => setTmsEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acc-sendas">Send-As Name (Optional)</Label>
                <Input
                  id="acc-sendas"
                  placeholder="The Mind Space Team"
                  value={sendAsName}
                  onChange={(e) => setSendAsName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Password Field & Generator */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="acc-password">Account Password *</Label>
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
                id="acc-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter or generate a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength checklist */}
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
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !allRulesMet}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

