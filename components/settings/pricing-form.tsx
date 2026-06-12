"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
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
  type QuotientRule,
} from "@/lib/pricing-config";
import {
  calculateItemSuggestedPrice,
  getCategoryQuotient,
} from "@/lib/pricing-engine";

function previewPrice(config: PricingConfig): number {
  return calculateItemSuggestedPrice(
    {
      todaySilverRate: 602,
      weightGrams: 25,
      purchasePricePerPiece: 5000,
      categoryName: "Real Premium Necklaces",
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

  const samplePrice = useMemo(() => {
    try {
      return previewPrice(config);
    } catch {
      return null;
    }
  }, [config]);

  const updateRule = (index: number, patch: Partial<QuotientRule>) => {
    setConfig((prev) => ({
      ...prev,
      quotientRules: prev.quotientRules.map((rule, i) =>
        i === index ? { ...rule, ...patch } : rule
      ),
    }));
  };

  const addRule = () => {
    setConfig((prev) => ({
      ...prev,
      quotientRules: [
        ...prev.quotientRules,
        {
          id: `rule_${Date.now()}`,
          label: "New Rule",
          keywords: ["keyword"],
          quotient: prev.defaultQuotient,
        },
      ],
    }));
  };

  const removeRule = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      quotientRules: prev.quotientRules.filter((_, i) => i !== index),
    }));
  };

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
            Configure how suggested sale prices are calculated. Rules are evaluated
            top to bottom — first keyword match wins.
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
              <code>purchasePricePerPiece</code>, <code>quotient</code>. Use standard
              math operators (+, -, *, /, parentheses).
            </p>
            <p className="text-xs text-muted-foreground">
              Default:{" "}
              <code>
                ((silverRate * weightGrams) + purchasePricePerPiece) * quotient
              </code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultQuotient">Default category quotient</Label>
            <Input
              id="defaultQuotient"
              type="number"
              min={0.01}
              step="0.01"
              className="max-w-xs"
              value={config.defaultQuotient}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  defaultQuotient: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Used when no keyword rule matches the category name.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Category quotient rules</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRule}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>

            {config.quotientRules.map((rule, index) => (
              <div
                key={rule.id}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_120px_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={rule.label}
                    onChange={(e) => updateRule(index, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Keywords (comma-separated)</Label>
                  <Input
                    value={rule.keywords.join(", ")}
                    onChange={(e) =>
                      updateRule(index, {
                        keywords: e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="real_premium, real premium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quotient</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={rule.quotient}
                    onChange={(e) =>
                      updateRule(index, { quotient: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(index)}
                    disabled={config.quotientRules.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium">Live preview</p>
            <p className="text-muted-foreground">
              Real Premium Necklaces · 25g · Rs. 602/g silver · Rs. 5,000 purchase/piece
            </p>
            <p className="mt-1">
              Quotient: ×
              {getCategoryQuotient("Real Premium Necklaces", config)} →{" "}
              {samplePrice != null ? (
                <span className="font-semibold">{formatPKR(samplePrice)}</span>
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
