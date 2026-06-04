import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { SearchX, RefreshCw, Users } from "lucide-react";

const NotFoundErrorPage = ({ fetchedItem }: { fetchedItem: string }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle>Not Found</CardTitle>
              <p className="text-sm text-muted-foreground">
                {fetchedItem} could not be located
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-normal">
            Empty
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted/20 p-3 mb-4">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {fetchedItem} Not Found
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            The {fetchedItem.toLowerCase()} you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotFoundErrorPage;
