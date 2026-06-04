import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Mail, Phone, User, Package } from "lucide-react";

export default function MemberDetails({ member }: any) {
  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Member Details</h2>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-sm sm:text-base truncate">{member.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-sm sm:text-base font-mono truncate">{member.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm sm:text-base truncate">{member.email || "—"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Active Packages</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {member.activePkgs}
                  </span>
                  <span className="text-sm sm:text-base font-medium">
                    {member.activePkgs === 1 ? 'Package' : 'Packages'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
