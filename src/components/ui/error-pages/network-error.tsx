import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";

const NetworkErrorPage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle>Connection Error</CardTitle>
              <p className="text-sm text-muted-foreground">
                Unable to load member data
              </p>
            </div>
          </div>
          <Badge variant="destructive" className="font-normal">
            Offline
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Network Connection Issue
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Connection interrupted. Please check your internet connection and try again.
          </p>
          <Button onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkErrorPage;
