"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KaregarForm } from "@/components/karegar/karegar-form";

export default function NewKaregarWorkerPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Karegar</h1>
        <p className="text-muted-foreground">Add a worker</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <KaregarForm
            submitLabel="Create Karegar"
            onSubmit={async (data) => {
              const res = await fetch("/api/karegar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, isActive: true }),
              });
              const json = await res.json();
              if (!json.success) throw new Error(json.error || "Failed to create karegar");
              router.push("/dashboard/karegar");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
