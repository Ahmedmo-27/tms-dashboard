"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, KeyRound, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { verifyPaymentsPin } from "@/lib/data/payments";

const STORAGE_KEY = "tms_payments_pin_unlocked";
const DEFAULT_PIN = "1967";

interface PaymentsPinContextType {
  isBranchAdmin: boolean;
  onLock: () => void;
}

const PaymentsPinContext = createContext<PaymentsPinContextType | null>(null);

export function usePaymentsPin() {
  return useContext(PaymentsPinContext);
}

export function PaymentsPinGate({ children }: { children: React.ReactNode }) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(currentUser?.role as string | undefined);
  const isBranchAdmin = permissionRole === "branch_admin";

  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsUnlocked(true);
      }
    }
  }, []);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim() || isVerifying) return;

    const userLocationId =
      (currentUser as any)?.locationId?.toString?.() ||
      (currentUser as any)?.locationId;

    setIsVerifying(true);
    try {
      const isVerified = await verifyPaymentsPin(pinInput.trim(), userLocationId);
      if (isVerified) {
        sessionStorage.setItem(STORAGE_KEY, "true");
        setIsUnlocked(true);
        setErrorMessage(null);
        setPinInput("");
        toast.success("Payments access granted");
      } else {
        setErrorMessage("Incorrect PIN. Please try again.");
        toast.error("Incorrect PIN");
      }
    } catch {
      setErrorMessage("Failed to verify PIN. Please try again.");
      toast.error("Verification error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    setPinInput("");
    setErrorMessage(null);
    toast.success("Payments locked");
  };

  // While mounting on client, don't flash content if branch_admin
  if (!mounted) {
    if (isBranchAdmin) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      );
    }
    return <>{children}</>;
  }

  // Non-branch-admin roles (e.g. management, accountant) have direct access
  if (!isBranchAdmin) {
    return <>{children}</>;
  }

  // If branch_admin and already unlocked in current session
  if (isUnlocked) {
    const shouldPassProp =
      React.isValidElement(children) && typeof children.type !== "string";

    return (
      <PaymentsPinContext.Provider value={{ isBranchAdmin, onLock: handleLock }}>
        {shouldPassProp
          ? React.cloneElement(children as React.ReactElement<any>, {
              onLock: handleLock,
            })
          : children}
      </PaymentsPinContext.Provider>
    );
  }

  // Render PIN Authorization Lock Screen
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Payments Protected
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Branch Admin access to payments requires entering the authorization PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoFocus
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="pl-9 pr-10 text-center tracking-widest text-lg font-mono"
                  maxLength={10}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!pinInput.trim() || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock Payments"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
