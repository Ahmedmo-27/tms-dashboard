"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useCoachApi } from "@/hooks/useCoachApi";
import { changeCoachPassword } from "@/lib/data/coach-portal";
import { logoutCoach } from "@/lib/store/features/coachSlice";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { LogOut, Loader2 } from "lucide-react";

export function CoachSettings() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const coachApi = useCoachApi();
  const { name, email, phoneNumber, branchName } = useAppSelector(
    (s) => s.coach
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await changeCoachPassword(coachApi, currentPassword, newPassword);
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      const code = err?.response?.data?.code || err?.context?.code;
      const serverMsg = err?.response?.data?.message || err?.context?.message;
      let message = serverMsg || "Could not update password.";
      if (code === "INVALID_CREDENTIALS") {
        message = "Current password is incorrect.";
      } else if (code === "WEAK_PASSWORD") {
        message = serverMsg || "Password must be at least 10 characters with letters, numbers, and symbols.";
      } else if (code === "MISSING_FIELDS") {
        message = "Please provide both current and new passwords.";
      } else if (code === "USER_NOT_FOUND") {
        message = "Coach account not found.";
      }
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name · </span>
            {name || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Phone · </span>
            {phoneNumber || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Email · </span>
            {email || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Branch · </span>
            {branchName || "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                minLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 10 characters.
              </p>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        onClick={() => {
          dispatch(logoutCoach());
          router.replace("/login");
        }}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
