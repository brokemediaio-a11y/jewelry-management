"use client";

import Link from "next/link";
import { Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  SENT_TO_WORKSHOP: "Sent to workshop",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
};

export function WorkshopStatusBanner({
  workshopOrder,
  saleStatus,
}: {
  workshopOrder: {
    id?: string;
    status: string;
    karegar?: { id: string; name: string } | null;
  };
  saleStatus: string;
}) {
  const isComplete = workshopOrder.status === "COMPLETE";
  const isOpenSale = saleStatus === "OPEN";

  return (
    <Card
      className={
        isComplete
          ? "border-success-border bg-success-muted"
          : isOpenSale
            ? "border-warning-border bg-warning-muted"
            : "border-muted"
      }
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-start gap-3">
          <Hammer className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Workshop order</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={isComplete ? "default" : "secondary"}>
                {STATUS_LABELS[workshopOrder.status] || workshopOrder.status}
              </Badge>
              {workshopOrder.karegar?.name && (
                <span className="text-muted-foreground">
                  Assigned to {workshopOrder.karegar.name}
                </span>
              )}
            </div>
            {isOpenSale && !isComplete && (
              <p className="text-xs text-[var(--warning)]">
                Sale cannot be closed until workshop status is Complete.
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/karegar">Open Karegar queue</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
