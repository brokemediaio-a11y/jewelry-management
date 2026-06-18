import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusBadgeVariant } from "@/lib/display-labels";

const variantStyles: Record<StatusBadgeVariant, string> = {
  success:
    "bg-success-muted text-[var(--success)] border-success-border",
  warning:
    "bg-warning-muted text-[var(--warning)] border-warning-border",
  muted: "bg-muted text-muted-foreground border-border",
  info: "bg-info-muted text-[var(--info)] border-info-border",
  default: "",
};

export function StatusBadge({
  label,
  variant = "default",
  className,
}: {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(variantStyles[variant], className)}>
      {label}
    </Badge>
  );
}
