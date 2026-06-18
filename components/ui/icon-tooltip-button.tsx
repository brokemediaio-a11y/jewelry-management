"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconTooltipButtonProps = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "ghost" | "outline" | "default" | "destructive";
  size?: "icon" | "sm" | "default";
  disabled?: boolean;
  className?: string;
};

export function IconTooltipButton({
  label,
  icon,
  href,
  onClick,
  variant = "ghost",
  size = "icon",
  disabled,
  className,
}: IconTooltipButtonProps) {
  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      {icon}
    </Button>
  );

  const trigger = href ? (
    <Button variant={variant} size={size} asChild className={className} aria-label={label}>
      <Link href={href}>{icon}</Link>
    </Button>
  ) : (
    button
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
