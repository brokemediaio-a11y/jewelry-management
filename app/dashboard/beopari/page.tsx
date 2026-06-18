"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BeopariTable, type BeopariRow } from "@/components/beopari/beopari-table";

export default function BeopariListPage() {
  const [rows, setRows] = useState<BeopariRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/beopari?limit=50");
      const data = await res.json();
      if (data.success) setRows(data.data);
      else setError(data.error || "Failed to load beoparis");
    } catch {
      setError("Failed to load beoparis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beopari</h1>
          <p className="text-muted-foreground">Beopari ledger — vendor purchases and payments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/beopari/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Beopari
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All beoparis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <BeopariTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

