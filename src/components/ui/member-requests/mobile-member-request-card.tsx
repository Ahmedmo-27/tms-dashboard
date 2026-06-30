import { Card, CardContent } from "../card";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  Phone,
  Mail,
  Check,
  UserPlus,
  Loader2,
} from "lucide-react";
import { User as MemberRequest } from "./columns";
import { acceptMemberAction } from "@/lib/actions/member-actions";
import { useState } from "react";
import toast from "react-hot-toast";
import { ApiError } from "@/core/api-error";

interface MobileMemberRequestCardProps {
  memberRequest: MemberRequest;
}

export function MobileMemberRequestCard({ memberRequest }: MobileMemberRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const initials = memberRequest.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleAddMember = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      const result = await acceptMemberAction(memberRequest.id);
      if (result.success) {
        toast.success(`${memberRequest.name} was accepted as a member.`);
        window.location.reload();
        return;
      }

      const message =
        result.errors instanceof ApiError
          ? result.errors.message
          : result.errors?.message || "Failed to accept member request.";
      toast.error(message);
    } catch {
      toast.error("Failed to accept member request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(memberRequest.phone);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (memberRequest.email) {
      navigator.clipboard.writeText(memberRequest.email);
    }
  };

  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow touch-manipulation" 
      role="article" 
      aria-label={`Member request from ${memberRequest.name}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {memberRequest.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Pending Request
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div 
              className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={handleCopyPhone}
              title="Click to copy phone number"
            >
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{memberRequest.phone}</span>
            </div>
            {memberRequest.email && (
              <div 
                className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={handleCopyEmail}
                title="Click to copy email"
              >
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{memberRequest.email}</span>
              </div>
            )}
            {memberRequest.pendingPackages?.length > 0 && (
              <div className="text-sm text-foreground">
                <span className="text-muted-foreground">Packages: </span>
                {memberRequest.pendingPackages.map((pkg, index) => (
                  <span key={index}>
                    {index > 0 ? ", " : ""}
                    {pkg.pkgName} ({pkg.remainingClasses} left)
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <Button
              onClick={handleAddMember}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? "Adding Member..." : "Add Member"}
            </Button>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>New member request</span>
              <span>Tap contact info to copy</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
