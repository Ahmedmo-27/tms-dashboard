import { Card, CardContent } from "../card";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import { 
  Phone, 
  Mail, 
  User, 
  Check,
  UserPlus
} from "lucide-react";
import { User as MemberRequest } from "./columns";
import { cn } from "@/lib/utils";
import { addMember } from "@/lib/data/users";
import { useState } from "react";

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
      await addMember(memberRequest.id);
      window.location.reload();
    } catch (error) {
      console.error('Failed to add member:', error);
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
          {/* Header with member info and status */}
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

          {/* Contact details */}
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
          </div>

          {/* Action button */}
          <div className="pt-3 border-t">
            <Button
              onClick={handleAddMember}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Check className="h-4 w-4 mr-2" />
              {isProcessing ? "Adding Member..." : "Add Member"}
            </Button>
          </div>

          {/* Request info */}
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
