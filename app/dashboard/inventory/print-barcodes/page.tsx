import { Suspense } from "react";
import { BulkBarcodePrintContent } from "./content";

export default function BulkBarcodePrintPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <BulkBarcodePrintContent />
    </Suspense>
  );
}
