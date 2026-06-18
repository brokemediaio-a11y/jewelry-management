"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";
import { formatPKR } from "@/lib/currency-utils";
import { canViewCashPill } from "@/lib/auth-redirect";

export function NavbarCashPill({ role }: { role: string }) {
  const [cashInHand, setCashInHand] = useState<number | null>(null);

  useEffect(() => {
    if (!canViewCashPill(role as "ADMIN" | "ACCOUNTANT" | "CLERK" | "STAFF")) return;
    fetch("/api/cash-position")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCashInHand(d.data.cashInHand);
      })
      .catch(() => {});
  }, [role]);

  if (!canViewCashPill(role as "ADMIN" | "ACCOUNTANT" | "CLERK" | "STAFF")) {
    return null;
  }

  return (
    <Link
      href="/dashboard/reports/cash-position?period=this-month"
      className="hidden items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-muted sm:flex"
      title="View cash position report"
    >
      <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">Cash:</span>
      <span className="tabular-nums">
        {cashInHand != null ? formatPKR(cashInHand) : "…"}
      </span>
    </Link>
  );
}
