"use client";

import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportExportMenu({
  queryString,
  reportId,
  supportsPdf,
  supportsExcel,
  disabled,
}: {
  queryString: string;
  reportId: string;
  supportsPdf?: boolean;
  supportsExcel?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const download = (format: string) => {
    window.location.href = `/api/reports/${reportId}/export?${queryString}&format=${format}`;
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 min-w-[140px] rounded-md border bg-popover p-1 shadow-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
              onClick={() => download("csv")}
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            {supportsPdf && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                onClick={() => download("pdf")}
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
            )}
            {supportsExcel && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                onClick={() => download("xlsx")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
