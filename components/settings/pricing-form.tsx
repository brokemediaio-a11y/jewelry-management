"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/pricing-config";
import { calculateItemSuggestedPrice } from "@/lib/pricing-engine";

function previewPrice(config: PricingConfig, quality: "PREMIUM" | "LOCAL"): number {
  return calculateItemSuggestedPrice(
    {
      todaySilverRate: 602,
      weightGrams: 25,
      stonePrice: 5000,
      itemQuality: quality,
    },
    config
  );
}

export function SettingsPricing() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);

  useEffect(() => {
    fetch("/api/settings/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConfig(data.data);
        } else {
          setError(data.error || "Failed to load pricing settings");
        }
      })
      .catch(() => setError("Failed to load pricing settings"))
      .finally(() => setLoading(false));
  }, []);

  const premiumPreview = useMemo(() => {
    try {
      return previewPrice(config, "PREMIUM");
    } catch {
      return null;
    }
  }, [config]);

  const localPreview = useMemo(() => {
    try {
      return previewPrice(config, "LOCAL");
    } catch {
      return null;
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();

      if (data.success) {
        setConfig(data.data);
        setSuccess(true);
      } else {
        setError(data.error || "Failed to save pricing settings");
      }
    } catch {
      setError("Failed to save pricing settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset pricing formula and quotients to defaults?")) return;

    setResetting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings/pricing", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setConfig(data.data);
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset pricing settings");
      }
    } catch {
      setError("Failed to reset pricing settings");
    } finally {
      setResetting(false);
    }
  };

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Sale Price Formula</CardTitle>
          </div>
          <CardDescription>
            Suggested sale price uses today&apos;s silver rate, item weight, stone
            price, and a quotient based on item quality (Premium or Local).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>Pricing settings saved successfully.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="formula">Formula expression</Label>
            <Textarea
              id="formula"
              rows={3}
              className="font-mono text-sm"
              value={config.formula}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, formula: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Variables: <code>silverRate</code>, <code>weightGrams</code>,{" "}
              <code>stonePrice</code>, <code>quotient</code>. Use standard math
              operators (+, -, *, /, parentheses).
            </p>
            <p className="text-xs text-muted-foreground">
              Default:{" "}
              <code>
                ((silverRate * weightGrams) + stonePrice) * quotient
              </code>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="premiumQuotient">Premium quality quotient</Label>
              <Input
                id="premiumQuotient"
                type="number"
                min={0.01}
                step="0.01"
                value={config.premiumQuotient}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    premiumQuotient: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Applied when item quality is Premium (default: 4)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localQuotient">Local quality quotient</Label>
              <Input
                id="localQuotient"
                type="number"
                min={0.01}
                step="0.01"
                value={config.localQuotient}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    localQuotient: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Applied when item quality is Local (default: 2)
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium">Live preview</p>
            <p className="text-muted-foreground">
              25g · Rs. 602/g silver · Rs. 5,000 stone price
            </p>
            <p>
              Premium (×{config.premiumQuotient}):{" "}
              {premiumPreview != null ? (
                <span className="font-semibold">{formatPKR(premiumPreview)}</span>
              ) : (
                <span className="text-destructive">Invalid formula</span>
              )}
            </p>
            <p>
              Local (×{config.localQuotient}):{" "}
              {localPreview != null ? (
                <span className="font-semibold">{formatPKR(localPreview)}</span>
              ) : (
                <span className="text-destructive">Invalid formula</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving || resetting}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Pricing Settings"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={saving || resetting}
            >
              {resetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
