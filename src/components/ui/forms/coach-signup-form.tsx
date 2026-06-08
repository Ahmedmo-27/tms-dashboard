"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { tms } from "@/lib/tms-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

interface Coach {
  _id: string;
  coachName: string;
}

// ─── Password rules ───────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { id: "length",    label: "At least 8 characters",       test: (p: string) => p.length >= 8 },
  { id: "upper",     label: "One uppercase letter (A–Z)",   test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",     label: "One lowercase letter (a–z)",   test: (p: string) => /[a-z]/.test(p) },
  { id: "number",    label: "One number (0–9)",             test: (p: string) => /[0-9]/.test(p) },
];

// ─── API error → human-readable message ──────────────────────────────────────

function friendlyError(err: any): string {
  const code: string = err?.response?.data?.error ?? "";
  const msg: string  = err?.response?.data?.message ?? "";

  const map: Record<string, string> = {
    EMAIL_ALREADY_EXISTS:   "That email address is already registered. Try logging in instead.",
    PHONE_ALREADY_EXISTS:   "That phone number is already in use.",
    COACH_ALREADY_LINKED:   "This coach profile is already linked to an account.",
    INVALID_EMAIL:          "Please enter a valid email address.",
    WEAK_PASSWORD:          "Your password is too weak. Check the requirements below.",
    MISSING_FIELDS:         "Please fill in all required fields.",
    COACH_NOT_FOUND:        "Coach profile not found. Please contact your administrator.",
    INVALID_PHONE:          "Phone number format is invalid. Use digits only (e.g. 01234567890).",
  };

  return map[code] ?? msg ?? "Registration failed. Please try again.";
}

// ─── Rule indicator ───────────────────────────────────────────────────────────

function RuleRow({ label, met, touched }: { label: string; met: boolean; touched: boolean }) {
  if (!touched) {
    return (
      <li className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 inline-block shrink-0" />
        {label}
      </li>
    );
  }
  return (
    <li className={cn("flex items-center gap-1.5", met ? "text-green-600 dark:text-green-400" : "text-destructive")}>
      {met
        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        : <XCircle      className="h-3.5 w-3.5 shrink-0" />
      }
      {label}
    </li>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function CoachSignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [coaches, setCoaches]               = useState<Coach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [pending, setPending]               = useState(false);
  const [errorMsg, setErrorMsg]             = useState("");
  const [success, setSuccess]               = useState(false);

  // Password state
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwTouched, setPwTouched]       = useState(false);

  const pwRulesMet = PASSWORD_RULES.map((r) => r.test(password));
  const allRulesMet = pwRulesMet.every(Boolean);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await tms.get("/external/unlinked-coaches");
        setCoaches(response.data.data);
      } catch (err: any) {
        console.error("Failed to load coaches", err);
      } finally {
        setLoadingCoaches(false);
      }
    };
    fetchCoaches();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setPwTouched(true);

    // Client-side password guard
    if (!allRulesMet) {
      setErrorMsg("Your password doesn't meet all requirements. Check the checklist below.");
      return;
    }

    setPending(true);

    const formData    = new FormData(e.currentTarget);
    const email       = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    const selectedCoach = coaches.find((c) => c._id === selectedCoachId);
    if (!selectedCoach) {
      setErrorMsg("Please select your name from the list.");
      setPending(false);
      return;
    }

    try {
      await tms.post("/external/register-coach", {
        coachId: selectedCoachId,
        name: selectedCoach.coachName,
        email,
        phoneNumber,
        password,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setErrorMsg(friendlyError(err));
    } finally {
      setPending(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Registration Successful!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-3xl font-bold">Coach Registration 👋</div>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Select your name and enter your details to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">

              {/* Coach name selector */}
              <div className="grid gap-3">
                <Label htmlFor="coachId">Select Your Name</Label>
                <Select
                  value={selectedCoachId}
                  onValueChange={setSelectedCoachId}
                  disabled={loadingCoaches || pending}
                  required
                >
                  <SelectTrigger id="coachId">
                    <SelectValue placeholder={loadingCoaches ? "Loading..." : "Select your name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem key={coach._id} value={coach._id}>
                        {coach.coachName}
                      </SelectItem>
                    ))}
                    {!loadingCoaches && coaches.length === 0 && (
                      <SelectItem value="none" disabled>
                        No unlinked coaches found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="coach@example.com"
                  disabled={pending}
                  required
                />
              </div>

              {/* Phone */}
              <div className="grid gap-3">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="01234567890"
                  disabled={pending}
                  required
                />
              </div>

              {/* Password with show/hide toggle */}
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!pwTouched) setPwTouched(true);
                    }}
                    disabled={pending}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Per-rule checklist */}
                <ul className="flex flex-col gap-1 text-xs mt-1">
                  {PASSWORD_RULES.map((rule, i) => (
                    <RuleRow
                      key={rule.id}
                      label={rule.label}
                      met={pwRulesMet[i]}
                      touched={pwTouched}
                    />
                  ))}
                </ul>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Registering..." : "Register"}
              </Button>

              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Login
                </button>
              </div>

            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
