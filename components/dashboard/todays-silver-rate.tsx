"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPKR } from "@/lib/currency-utils";
import { useSilverRateStore } from "@/stores/silver-rate-store";

export function SilverRateInitializer() {
  const fetchRate = useSilverRateStore((s) => s.fetchRate);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return null;
}

export function TodaysSilverRateCard() {
  const { rate, loading, saving, error, saveRate } = useSilverRateStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (rate && !editing) {
      setDraft(String(rate.ratePerGram));
    }
  }, [rate, editing]);

  const handleSave = async () => {
    const ok = await saveRate(Number(draft));
    if (ok) {
      setEditing(false);
      setSaveMessage(
        "Rate saved for this session. It is used everywhere and will not auto-refresh for 24 hours."
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <CardTitle>Today&apos;s Silver Rate</CardTitle>
          </div>
          <CardDescription>
            Used for inventory pricing, sales, and suggested prices across the app
          </CardDescription>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={loading}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                if (rate) setDraft(String(rate.ratePerGram));
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {saveMessage && (
          <Alert>
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}

        {loading && !rate ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading silver rate...
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="silver-rate">Rate per gram (PKR)</Label>
              {editing ? (
                <Input
                  id="silver-rate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-48"
                />
              ) : (
                <p className="text-3xl font-bold">{formatPKR(rate?.ratePerGram ?? 0)}</p>
              )}
            </div>
            {rate && (
              <div className="text-sm text-muted-foreground">
                <p>Currency: {rate.currency}</p>
                <p>Updated: {new Date(rate.fetchedAt).toLocaleString()}</p>
                {rate.isSessionOverride && rate.lockedUntil ? (
                  <p className="font-medium text-brand-bronze">
                    Manually set — locked until {new Date(rate.lockedUntil).toLocaleString()}
                  </p>
                ) : (
                  <p>{rate.fromCache ? "From API cache" : "Live from API"}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
