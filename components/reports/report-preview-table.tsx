"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPKR } from "@/lib/currency-utils";
import type { ReportColumn, ReportRow } from "@/lib/report-types";

function formatCell(key: string, value: string | number | null): string {
  if (value == null) return "—";
  if (
    typeof value === "number" &&
    (key.includes("amount") ||
      key.includes("total") ||
      key.includes("cost") ||
      key.includes("revenue") ||
      key.includes("value") ||
      key.includes("advance") ||
      key.includes("remaining") ||
      key === "silverRate" ||
      key === "costPerGram")
  ) {
    return formatPKR(value);
  }
  return String(value);
}

export function ReportPreviewTable({
  columns,
  rows,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
}) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No data for this period.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.align === "right" ? "text-right" : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={`${col.align === "right" ? "text-right" : ""} ${
                    col.key === "items" || col.key === "description" ? "max-w-[280px] truncate" : ""
                  }`}
                >
                  {formatCell(col.key, row[col.key] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
