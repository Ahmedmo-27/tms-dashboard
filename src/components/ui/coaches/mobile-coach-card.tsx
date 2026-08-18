import { Card, CardContent } from "../card";
import { Button } from "../button";
import { UserCheck, Phone, MessageCircle } from "lucide-react";
import { Coach } from "./columns";
import EditCoachDialog from "../dialogs/coach/edit-coach";
import {
  formatDisplayPhone,
  telHref,
  whatsAppHref,
} from "@/lib/utils/phone";

interface MobileCoachCardProps {
  coach: Coach;
}

export function MobileCoachCard({ coach }: MobileCoachCardProps) {
  const waLink = whatsAppHref(coach.phoneNumber);
  const telLink = telHref(coach.phoneNumber);

  return (
    <Card className="w-full min-w-0 hover:shadow-md transition-shadow touch-manipulation py-0">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {coach.coachName}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground min-w-0">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {telLink ? (
                  <a
                    href={telLink}
                    className="text-xs sm:text-sm truncate hover:text-foreground hover:underline"
                  >
                    {formatDisplayPhone(coach.phoneNumber)}
                  </a>
                ) : (
                  <span className="text-xs sm:text-sm truncate">
                    {formatDisplayPhone(coach.phoneNumber)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {waLink && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full text-xs sm:text-sm"
              asChild
            >
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-3.5 w-3.5" />
                WhatsApp
              </a>
            </Button>
          )}

          <div className="pt-2.5 sm:pt-3 border-t [&_button]:w-full">
            <EditCoachDialog coach={coach} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
