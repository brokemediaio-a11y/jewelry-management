"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Loader2, RefreshCw } from "lucide-react";
import { formatPKR } from "@/lib/currency-utils";

interface SilverRateResponse {
  ratePerGram: number;
  currency: string;
  fetchedAt: string;
  fromCache: boolean;
}

export function SettingsRates() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rate, setRate] = useState<SilverRateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRate = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const endpoint = refresh ? "/api/silver-rates/refresh" : "/api/silver-rates/current";
      const response = await fetch(endpoint, refresh ? { method: "POST" } : undefined);
      const data = await response.json();

      if (data.success) {
        setRate(data.data);
      } else {
        setError(data.error || "Failed to load silver rate");
      }
    } catch {
      setError("Failed to load silver rate");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          <CardTitle>Silver Rate (PKR)</CardTitle>
        </div>
        <CardDescription>
          Live rate from GoldPriceZ API — used for inventory and sales pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {rate && (
          <div className="space-y-2">
            <p className="text-3xl font-bold">{formatPKR(rate.ratePerGram)} / gram</p>
            <p className="text-sm text-muted-foreground">
              Currency: {rate.currency} · Updated: {new Date(rate.fetchedAt).toLocaleString()}
              {rate.fromCache ? " (cached)" : " (live)"}
            </p>
          </div>
        )}

        <Button onClick={() => loadRate(true)} disabled={refreshing} variant="outline">
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Rate
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
