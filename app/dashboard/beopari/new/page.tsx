"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewBeopariPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessStartDate, setBusinessStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/beopari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessStartDate,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to create beopari");
        return;
      }
      router.push(`/dashboard/beopari/${data.data.id}`);
    } catch {
      setError("Failed to create beopari");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Beopari</h1>
        <p className="text-muted-foreground">Add a beopari (vendor)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label>Business start date</Label>
            <Input
              type="date"
              value={businessStartDate}
              onChange={(e) => setBusinessStartDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting} />
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "Saving..." : "Create Beopari"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

