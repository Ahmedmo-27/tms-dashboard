"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { ShieldAlert, Home, LogOut, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/lib/store/features/authSlice";
import { logoutCoach } from "@/lib/store/features/coachSlice";
import { logout as serverLogout } from "@/lib/data/auth";
import { isCoachRole } from "@/lib/config/roles";
import { useRouter } from "next/navigation";

const UnauthorizedPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const authUser = useAppSelector((state) => state.auth.user);
  const coachId = useAppSelector((state) => state.coach.coachId);
  const isCoach = isCoachRole(authUser?.role as string | undefined) || Boolean(coachId);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await serverLogout();
    } finally {
      dispatch(logout());
      dispatch(logoutCoach());
      router.replace("/login");
    }
  };

  const handleGoToCoachPortal = () => {
    router.replace("/coach/today");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Card className="w-full border-destructive/20 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">Access Restricted</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isCoach ? "Coach Account Detected" : "Insufficient Permissions"}
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="font-normal">
                403 Forbidden
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>

              <h2 className="text-lg font-semibold mb-2 text-foreground">
                {isCoach
                  ? "Staff Dashboard is Restricted"
                  : "You are not authorized to view this page"}
              </h2>

              <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                {isCoach
                  ? "Your account has Coach privileges, which are restricted to the Coach Portal. You cannot access staff management sections."
                  : "You don't have the necessary role or permissions to view this section. Please log in with an authorized staff account."}
              </p>

              <div className="flex flex-col gap-3 w-full">
                {isCoach && (
                  <Button
                    onClick={handleGoToCoachPortal}
                    className="flex items-center justify-center gap-2 w-full"
                    size="lg"
                  >
                    <Home className="h-4 w-4" />
                    Go to Coach Portal
                  </Button>
                )}

                <Button
                  onClick={handleLogout}
                  variant={isCoach ? "outline" : "default"}
                  className="flex items-center justify-center gap-2 w-full"
                  size="lg"
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {isCoach ? "Log Out from Coach Account" : "Go to Login"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

