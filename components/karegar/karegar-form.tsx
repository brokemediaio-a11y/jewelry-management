"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function KaregarForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Karegar",
}: {
  defaultValues?: { name?: string; phone?: string | null };
  onSubmit: (data: { name: string; phone: string | null }) => Promise<void>;
  submitLabel?: string;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [phone, setPhone] = useState(defaultValues?.phone || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim() || null });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message || "")
          : "Failed to save karegar";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
