import { format } from "date-fns";
import { Badge } from "../badge";
import { Avatar, AvatarFallback } from "../avatar";
import { Card, CardContent } from "../card";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Phone,
  MapPin,
} from "lucide-react";
import { Payment } from "./columns";
import { OutflowPurposeCell } from "./outflow-details-dialog";
import { isOutflowTransaction } from "@/lib/utils/parsers/payments-parser";

const getPaymentMethodIcon = (method: string) => {
  switch ((method ?? "").toLowerCase()) {
    case "cash":
      return <Banknote className="h-4 w-4" />;
    case "instapay":
    case "app":
      return <Smartphone className="h-4 w-4" />;
    case "valu":
      return <Building2 className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

const getPaymentMethodColor = (method: string) => {
  switch ((method ?? "").toLowerCase()) {
    case "cash":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "instapay":
    case "app":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "valu":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }
};

interface MobilePaymentCardProps {
  payment: Payment;
}

export function MobilePaymentCard({ payment }: MobilePaymentCardProps) {
  const memberName = payment.memberName ?? "—";
  const initials = memberName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const numericAmount = typeof payment.amount === 'string'
    ? parseFloat(payment.amount.replace(/[^0-9.-]+/g, ""))
    : parseFloat(String(payment.amount));
  const isOutflow = isOutflowTransaction(payment);

  return (
    <Card className="w-full hover:shadow-md transition-shadow touch-manipulation" role="article" aria-label={`Payment from ${memberName}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with member info and amount */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {memberName}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{payment.phone}</span>
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-mono font-bold text-lg ${isOutflow ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                {isOutflow ? "-" : ""}EGP {Math.abs(numericAmount).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                <OutflowPurposeCell
                  payment={payment}
                  badgeClassName="text-[10px]"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Method</p>
                <Badge
                  variant="secondary"
                  className={`flex items-center gap-1.5 w-fit text-xs ${getPaymentMethodColor(
                    payment.paymentMethod
                  )}`}
                >
                  {getPaymentMethodIcon(payment.paymentMethod)}
                  {payment.paymentMethod}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                <div className="text-xs">
                  <div className="font-medium">
                    {format(new Date(payment.paymentTime), "MMM dd, yyyy")}
                  </div>
                  <div className="text-muted-foreground">
                    {format(new Date(payment.paymentTime), "hh:mm a")}
                  </div>
                </div>
              </div>
              {payment.classTime && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Class Time</p>
                  <div className="text-xs">
                    <div className="font-medium">
                      {format(new Date(payment.classTime), "MMM dd, yyyy")}
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(payment.classTime), "hh:mm a")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {payment.location && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{payment.location}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
