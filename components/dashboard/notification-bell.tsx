"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  severity: "info" | "warning" | "urgent";
};

const severityDot: Record<Notification["severity"], string> = {
  urgent: "bg-destructive",
  warning: "bg-[var(--warning)]",
  info: "bg-primary",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotifications(d.data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const count = notifications.length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Notifications${count ? ` (${count})` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-80 rounded-md border bg-popover shadow-lg">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold">Alerts</p>
            </div>
            <div className="max-h-80 overflow-y-auto p-1">
              {loading ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
              ) : !notifications.length ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">No alerts right now.</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-2 rounded-sm px-3 py-2 hover:bg-accent"
                  >
                    <span
                      className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", severityDot[n.severity])}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
