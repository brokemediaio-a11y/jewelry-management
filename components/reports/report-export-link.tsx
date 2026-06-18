"use client";

import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportExportLink({
  href,
  label = "Export report",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>
        <FileBarChart className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
