"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  WorkshopQueueTable,
  type WorkshopQueueRow,
} from "@/components/karegar/workshop-queue-table";
import { ReportExportLink } from "@/components/reports/report-export-link";

type KaregarRow = { id: string; name: string; phone: string | null; isActive: boolean };

export default function KaregarPage() {
  const [orders, setOrders] = useState<WorkshopQueueRow[]>([]);
  const [karegars, setKaregars] = useState<KaregarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [karegarFilter, setKaregarFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (karegarFilter) params.set("karegarId", karegarFilter);

      const [ordersRes, karegarRes] = await Promise.all([
        fetch(`/api/workshop-orders?${params}`),
        fetch("/api/karegar?limit=100"),
      ]);
      const [ordersJson, karegarJson] = await Promise.all([
        ordersRes.json(),
        karegarRes.json(),
      ]);

      if (!ordersJson.success) throw new Error(ordersJson.error || "Failed to load orders");
      if (!karegarJson.success) throw new Error(karegarJson.error || "Failed to load karegars");

      let nextOrders: WorkshopQueueRow[] = ordersJson.data;
      if (dateFrom) {
        const from = new Date(dateFrom);
        nextOrders = nextOrders.filter((o) => new Date(o.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        nextOrders = nextOrders.filter((o) => new Date(o.createdAt) <= to);
      }

      setOrders(nextOrders);
      setKaregars(karegarJson.data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message || "")
          : "";
      setError(msg || "Failed to load karegar module");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, karegarFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const activeKaregars = useMemo(() => karegars.filter((k) => k.isActive), [karegars]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Karegar</h1>
          <p className="text-muted-foreground">Workshop queue and worker payments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReportExportLink
            href="/dashboard/reports/workshop-queue?period=this-month"
            label="Workshop report"
          />
          <Button asChild>
            <Link href="/dashboard/karegar/workers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Karegar
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Custom orders queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter || "ALL"}
                onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="SENT_TO_WORKSHOP">Sent</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Karegar</Label>
              <Select
                value={karegarFilter || "ALL"}
                onValueChange={(v) => setKaregarFilter(v === "ALL" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All karegars" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {karegars.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <WorkshopQueueTable rows={orders} karegars={activeKaregars} onUpdated={fetchAll} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Karegars</CardTitle>
        </CardHeader>
        <CardContent>
          {!karegars.length ? (
            <p className="text-sm text-muted-foreground">No karegars yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {karegars.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>{k.phone || "—"}</TableCell>
                    <TableCell>{k.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/karegar/workers/${k.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
