"use client";

import Link from "next/link";
import { Coins, Lock } from "lucide-react";
import { formatPKR } from "@/lib/currency-utils";
import { useEffectiveSilverRate, useSilverRateStore } from "@/stores/silver-rate-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavbarSilverRate() {
  const rate = useSilverRateStore((s) => s.rate);
  const loading = useSilverRateStore((s) => s.loading);
  const effectiveRate = useEffectiveSilverRate();

  if (loading && !rate) {
    return (
      <span className="hidden text-xs text-muted-foreground sm:inline">Silver rate…</span>
    );
  }

  const isOverride = rate?.isSessionOverride;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-1.5 px-2.5 text-xs font-medium sm:inline-flex"
          asChild
        >
          <Link href="/dashboard/settings">
            {isOverride ? (
              <Lock className="h-3.5 w-3.5 text-brand-bronze" />
            ) : (
              <Coins className="h-3.5 w-3.5" />
            )}
            <span className="tabular-nums">{formatPKR(effectiveRate)}/g</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isOverride ? "Session rate (locked) — click to manage in Settings" : "Today&apos;s silver rate — click to manage"}
      </TooltipContent>
    </Tooltip>
  );
}
