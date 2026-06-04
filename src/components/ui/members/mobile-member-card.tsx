import { Card, CardContent } from "../card";
import { Avatar, AvatarFallback } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Phone, Mail, Package, MoreHorizontal, User } from "lucide-react";
import { Member } from "./columns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MobileMemberCardProps {
  member: Member;
}

export function MobileMemberCard({ member }: MobileMemberCardProps) {
  const router = useRouter();
  
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleCardClick = () => {
    router.push(`/dashboard/our-members/${member.id}`);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(member.phone);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow touch-manipulation cursor-pointer" 
      role="article" 
      aria-label={`Member ${member.name}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with member info and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {member.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="h-3 w-3 flex-shrink-0" />
                  <span>{member.activePkgs} active package{member.activePkgs !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0" onClick={handleDropdownClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Helping {member.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyPhone}>
                    Copy phone number
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href={`/dashboard/our-members/${member.id}`}>
                      View member data
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{member.phone}</span>
            </div>
            {member.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
          </div>

          {/* Package status */}
          {member.activePkgs > 0 && (
            <div className="pt-2 border-t">
              <Badge 
                variant={member.activePkgs > 0 ? "default" : "secondary"} 
                className="text-xs"
              >
                {member.activePkgs > 0 ? "Active Member" : "No Active Packages"}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
