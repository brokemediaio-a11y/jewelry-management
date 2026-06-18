"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PurchaseForm } from "@/components/beopari/purchase-form";

function NewPurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const beopariId = searchParams.get("beopariId");

  if (!beopariId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Missing beopari.{" "}
          <Link href="/dashboard/beopari" className="underline">
            Go back to Beopari list
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/beopari/${beopariId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Purchase</h1>
          <p className="text-muted-foreground">Add a beopari purchase</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase details</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm
            beopariId={beopariId}
            onSaved={() => router.push(`/dashboard/beopari/${beopariId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewBeopariPurchasePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <NewPurchaseContent />
    </Suspense>
  );
}
