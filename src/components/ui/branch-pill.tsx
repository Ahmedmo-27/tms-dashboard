import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BranchPillProps = {
  label: string;
  className?: string;
};

export function BranchPill({ label, className }: BranchPillProps) {
  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-primary/30 bg-primary/5 text-primary font-normal text-xs",
        className
      )}
    >
      <MapPin className="h-3 w-3" />
      {label}
    </Badge>
  );
}
