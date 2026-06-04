"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@/lib/store/features/authSlice";
import { useRouter } from "next/navigation";
import { POST } from "@/lib/api-logout"

const UnauthorizedPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    POST()
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Card className="w-full border-destructive/20">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="h-6 w-6 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">Session Ended</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    You have been logged out
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="font-normal">
                Unauthorized
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-destructive/10 p-4 mb-6">
                <LogOut className="h-12 w-12 text-destructive" />
              </div>

              <h2 className="text-xl font-semibold mb-3 text-foreground">
                You have been logged out
              </h2>

              <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
                Your session has expired or you’ve been logged out for security reasons.
                Please log in again to continue.
              </p>

              <Button 
                onClick={handleLogout}
                className="flex items-center gap-2 w-full"
                size="lg"
              >
                <LogOut className="h-4 w-4" />
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
