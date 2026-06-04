"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { WifiOff, RefreshCw, AlertTriangle, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface NetworkErrorPageProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onRetry?: () => void;
}

const NetworkErrorPage = ({ 
  title = "Network Connection Error",
  description = "Unable to connect to the server. Please check your internet connection.",
  showHomeButton = true,
  showBackButton = true,
  onRetry
}: NetworkErrorPageProps) => {

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Card className="w-full border-destructive/20">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="h-6 w-6 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">Connection Error</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Service unavailable
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="font-normal">
                Offline
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-destructive/10 p-4 mb-6">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                {title}
              </h2>
              
              <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
                {description}
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={handleRetry} 
                  className="flex items-center gap-2 w-full"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <div className="flex gap-2 w-full">
                  {showBackButton && (
                    <Button 
                      onClick={handleBack}
                      variant="outline" 
                      className="flex items-center gap-2 flex-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Go Back
                    </Button>
                  )}

                  {showHomeButton && (
                    <Button 
                      asChild
                      variant="outline" 
                      className="flex items-center gap-2 flex-1"
                    >
                      <Link href="/dashboard/our-members">
                        <Home className="h-4 w-4" />
                        Home
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  If the problem persists, please contact support or try again later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkErrorPage;